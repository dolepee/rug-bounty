// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Minimal {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

contract RugBountyVault {
    uint256 public constant LAUNCH_WINDOW = 1 hours;
    uint256 public constant POST_EXPIRY_SLASH_WINDOW = 10 minutes;
    uint256 public constant MIN_FLOOR_BPS = 10; // 0.1%
    uint256 public constant MAX_DECLARED_WALLETS = 8;
    uint256 public constant MIN_BOND = 0.003 ether;
    uint256 public constant HUNTER_PAYOUT_BPS = 8000; // 80%
    uint256 public constant PROTOCOL_PAYOUT_BPS = 2000; // 20%
    address payable public constant PROTOCOL_TREASURY = payable(0x000000000000000000000000000000000000dEaD);

    enum BondStatus {
        ACTIVE,
        SLASHED,
        REFUNDED
    }

    struct Bond {
        address creator;
        address token;
        bytes32 launchTxHash;
        uint256 launchTimestamp;
        address[] declaredCreatorWallets;
        uint256 declaredRetainedBalance;
        uint256 bondAmount;
        uint256 createdAt;
        uint256 expiresAt;
        bytes32 oathHash;
        bytes32 rulesHash;
        bool breachObserved;
        BondStatus status;
        address slashedTo;
    }

    uint256 public nextBondId;
    mapping(uint256 => Bond) private bonds;

    event BondCreated(
        uint256 indexed bondId,
        address indexed creator,
        address indexed token,
        bytes32 launchTxHash,
        uint256 launchTimestamp,
        address[] declaredCreatorWallets,
        uint256 declaredRetainedBalance,
        uint256 bondAmount,
        uint256 expiresAt,
        string oathText,
        bytes32 oathHash,
        bytes32 rulesHash
    );

    event BondBreachFlagged(
        uint256 indexed bondId,
        address indexed observer,
        uint256 currentBalance,
        uint256 declaredRetainedBalance
    );

    event BondSlashed(
        uint256 indexed bondId,
        address indexed hunter,
        uint256 hunterPayout,
        uint256 protocolPayout,
        uint256 currentBalance,
        uint256 declaredRetainedBalance
    );

    event BondRefunded(
        uint256 indexed bondId,
        address indexed creator,
        uint256 amount
    );

    error BondNotActive();
    error BondExpired();
    error BondNotExpired();
    error NotCreator();
    error InvalidToken();
    error InvalidBondAmount();
    error InvalidLaunchWindow();
    error InvalidExpiry();
    error InvalidDeclaredWallets();
    error DuplicateDeclaredWallet();
    error CreatorWalletMissing();
    error CreatorBalanceBelowFloor();
    error CreatorBalanceStillAtOrAboveFloor();
    error FloorTooLow();
    error BreachAlreadyObserved();
    error BreachPreviouslyObserved();
    error HunterCannotBeDeclaredWallet();
    error TransferFailed();

    function createBond(
        address token,
        bytes32 launchTxHash,
        uint256 launchTimestamp,
        address[] calldata declaredCreatorWallets,
        uint256 declaredRetainedBalance,
        string calldata oathText,
        bytes32 rulesHash,
        uint256 expiresAt
    ) external payable returns (uint256 bondId) {
        if (token == address(0)) revert InvalidToken();
        if (msg.value < MIN_BOND) revert InvalidBondAmount();
        if (declaredCreatorWallets.length == 0 || declaredCreatorWallets.length > MAX_DECLARED_WALLETS) {
            revert InvalidDeclaredWallets();
        }
        if (launchTimestamp > block.timestamp || block.timestamp > launchTimestamp + LAUNCH_WINDOW) {
            revert InvalidLaunchWindow();
        }
        if (expiresAt <= block.timestamp) revert InvalidExpiry();

        bool senderDeclared = false;
        for (uint256 i = 0; i < declaredCreatorWallets.length; i++) {
            if (declaredCreatorWallets[i] == address(0)) revert InvalidDeclaredWallets();
            for (uint256 j = 0; j < i; j++) {
                if (declaredCreatorWallets[i] == declaredCreatorWallets[j]) revert DuplicateDeclaredWallet();
            }
            if (declaredCreatorWallets[i] == msg.sender) {
                senderDeclared = true;
            }
        }
        if (!senderDeclared) revert CreatorWalletMissing();

        uint256 totalSupply = IERC20Minimal(token).totalSupply();
        if (declaredRetainedBalance == 0) revert FloorTooLow();
        if (declaredRetainedBalance * 10000 < totalSupply * MIN_FLOOR_BPS) revert FloorTooLow();
        bytes32 oathHash = keccak256(bytes(oathText));

        uint256 current = _currentCreatorBalanceCalldata(token, declaredCreatorWallets);
        if (current < declaredRetainedBalance) revert CreatorBalanceBelowFloor();

        bondId = nextBondId++;
        Bond storage bond = bonds[bondId];
        bond.creator = msg.sender;
        bond.token = token;
        bond.launchTxHash = launchTxHash;
        bond.launchTimestamp = launchTimestamp;
        bond.declaredRetainedBalance = declaredRetainedBalance;
        bond.bondAmount = msg.value;
        bond.createdAt = block.timestamp;
        bond.expiresAt = expiresAt;
        bond.oathHash = oathHash;
        bond.rulesHash = rulesHash;
        bond.status = BondStatus.ACTIVE;

        for (uint256 i = 0; i < declaredCreatorWallets.length; i++) {
            bond.declaredCreatorWallets.push(declaredCreatorWallets[i]);
        }

        _emitBondCreated(bondId, bond, oathText);
    }

    function flagBreach(uint256 bondId) external {
        Bond storage bond = bonds[bondId];
        if (bond.status != BondStatus.ACTIVE) revert BondNotActive();
        if (block.timestamp >= bond.expiresAt + POST_EXPIRY_SLASH_WINDOW) revert BondExpired();
        if (bond.breachObserved) revert BreachAlreadyObserved();

        uint256 current = _currentCreatorBalance(bond.token, bond.declaredCreatorWallets);
        if (current >= bond.declaredRetainedBalance) revert CreatorBalanceStillAtOrAboveFloor();

        bond.breachObserved = true;

        emit BondBreachFlagged(bondId, msg.sender, current, bond.declaredRetainedBalance);
    }

    function resolveBond(uint256 bondId) external {
        Bond storage bond = bonds[bondId];
        if (bond.status != BondStatus.ACTIVE) revert BondNotActive();
        if (!bond.breachObserved && block.timestamp >= bond.expiresAt + POST_EXPIRY_SLASH_WINDOW) revert BondExpired();
        if (_isDeclaredWalletStorage(bond.declaredCreatorWallets, msg.sender)) revert HunterCannotBeDeclaredWallet();

        uint256 current = _currentCreatorBalance(bond.token, bond.declaredCreatorWallets);
        if (current >= bond.declaredRetainedBalance && !bond.breachObserved) revert CreatorBalanceStillAtOrAboveFloor();
        if (!bond.breachObserved) {
            bond.breachObserved = true;
        }

        bond.status = BondStatus.SLASHED;
        bond.slashedTo = msg.sender;
        uint256 payout = bond.bondAmount;
        bond.bondAmount = 0;
        uint256 protocolPayout = (payout * PROTOCOL_PAYOUT_BPS) / 10000;
        uint256 hunterPayout = payout - protocolPayout;

        if (hunterPayout > 0) {
            (bool success, ) = payable(msg.sender).call{value: hunterPayout}("");
            if (!success) revert TransferFailed();
        }
        if (protocolPayout > 0) {
            (bool success, ) = PROTOCOL_TREASURY.call{value: protocolPayout}("");
            if (!success) revert TransferFailed();
        }

        emit BondSlashed(bondId, msg.sender, hunterPayout, protocolPayout, current, bond.declaredRetainedBalance);
    }

    function refundAfterExpiry(uint256 bondId) external {
        Bond storage bond = bonds[bondId];
        if (bond.status != BondStatus.ACTIVE) revert BondNotActive();
        if (msg.sender != bond.creator) revert NotCreator();
        if (block.timestamp < bond.expiresAt + POST_EXPIRY_SLASH_WINDOW) revert BondNotExpired();
        if (bond.breachObserved) revert BreachPreviouslyObserved();

        uint256 current = _currentCreatorBalance(bond.token, bond.declaredCreatorWallets);
        if (current < bond.declaredRetainedBalance) revert CreatorBalanceBelowFloor();

        bond.status = BondStatus.REFUNDED;
        uint256 payout = bond.bondAmount;
        bond.bondAmount = 0;

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        if (!success) revert TransferFailed();

        emit BondRefunded(bondId, msg.sender, payout);
    }

    function getBond(uint256 bondId) external view returns (Bond memory) {
        return bonds[bondId];
    }

    function currentCreatorBalance(uint256 bondId) external view returns (uint256) {
        Bond storage bond = bonds[bondId];
        return _currentCreatorBalance(bond.token, bond.declaredCreatorWallets);
    }

    function _currentCreatorBalance(address token, address[] storage declaredWallets) internal view returns (uint256 sum) {
        for (uint256 i = 0; i < declaredWallets.length; i++) {
            sum += IERC20Minimal(token).balanceOf(declaredWallets[i]);
        }
    }

    function _currentCreatorBalanceCalldata(address token, address[] calldata declaredWallets) internal view returns (uint256 sum) {
        for (uint256 i = 0; i < declaredWallets.length; i++) {
            sum += IERC20Minimal(token).balanceOf(declaredWallets[i]);
        }
    }

    function _emitBondCreated(uint256 bondId, Bond storage bond, string calldata oathText) internal {
        emit BondCreated(
            bondId,
            bond.creator,
            bond.token,
            bond.launchTxHash,
            bond.launchTimestamp,
            bond.declaredCreatorWallets,
            bond.declaredRetainedBalance,
            bond.bondAmount,
            bond.expiresAt,
            oathText,
            bond.oathHash,
            bond.rulesHash
        );
    }

    function _isDeclaredWalletStorage(address[] storage declaredWallets, address account) internal view returns (bool) {
        for (uint256 i = 0; i < declaredWallets.length; i++) {
            if (declaredWallets[i] == account) {
                return true;
            }
        }
        return false;
    }
}
