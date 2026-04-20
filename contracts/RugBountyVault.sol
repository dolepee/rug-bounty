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
        uint256 baselineTotalSupply;
        uint256 bondAmount;
        uint256 createdAt;
        uint256 expiresAt;
        bytes32 oathHash;
        bytes32 rulesHash;
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
        uint256 baselineTotalSupply,
        uint256 bondAmount,
        uint256 expiresAt,
        bytes32 oathHash,
        bytes32 rulesHash
    );

    event BondSlashed(
        uint256 indexed bondId,
        address indexed hunter,
        uint256 bondPayout,
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
    error CreatorWalletMissing();
    error CreatorBalanceBelowFloor();
    error CreatorBalanceStillAtOrAboveFloor();
    error FloorTooLow();
    error HunterCannotBeDeclaredWallet();
    error TransferFailed();

    function createBond(
        address token,
        bytes32 launchTxHash,
        uint256 launchTimestamp,
        address[] calldata declaredCreatorWallets,
        uint256 declaredRetainedBalance,
        bytes32 oathHash,
        bytes32 rulesHash,
        uint256 expiresAt
    ) external payable returns (uint256 bondId) {
        if (token == address(0)) revert InvalidToken();
        if (msg.value == 0) revert InvalidBondAmount();
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
            if (declaredCreatorWallets[i] == msg.sender) {
                senderDeclared = true;
            }
        }
        if (!senderDeclared) revert CreatorWalletMissing();

        uint256 totalSupply = IERC20Minimal(token).totalSupply();
        if (declaredRetainedBalance == 0) revert FloorTooLow();
        if (declaredRetainedBalance * 10000 < totalSupply * MIN_FLOOR_BPS) revert FloorTooLow();

        uint256 current = _currentCreatorBalanceCalldata(token, declaredCreatorWallets);
        if (current < declaredRetainedBalance) revert CreatorBalanceBelowFloor();

        bondId = nextBondId++;
        Bond storage bond = bonds[bondId];
        bond.creator = msg.sender;
        bond.token = token;
        bond.launchTxHash = launchTxHash;
        bond.launchTimestamp = launchTimestamp;
        bond.declaredRetainedBalance = declaredRetainedBalance;
        bond.baselineTotalSupply = totalSupply;
        bond.bondAmount = msg.value;
        bond.createdAt = block.timestamp;
        bond.expiresAt = expiresAt;
        bond.oathHash = oathHash;
        bond.rulesHash = rulesHash;
        bond.status = BondStatus.ACTIVE;

        for (uint256 i = 0; i < declaredCreatorWallets.length; i++) {
            bond.declaredCreatorWallets.push(declaredCreatorWallets[i]);
        }

        emit BondCreated(
            bondId,
            bond.creator,
            bond.token,
            bond.launchTxHash,
            bond.launchTimestamp,
            bond.declaredCreatorWallets,
            bond.declaredRetainedBalance,
            bond.baselineTotalSupply,
            bond.bondAmount,
            bond.expiresAt,
            bond.oathHash,
            bond.rulesHash
        );
    }

    function resolveBond(uint256 bondId) external {
        Bond storage bond = bonds[bondId];
        if (bond.status != BondStatus.ACTIVE) revert BondNotActive();
        if (block.timestamp >= bond.expiresAt + POST_EXPIRY_SLASH_WINDOW) revert BondExpired();
        if (_isDeclaredWalletStorage(bond.declaredCreatorWallets, msg.sender)) revert HunterCannotBeDeclaredWallet();

        uint256 current = _currentCreatorBalance(bond.token, bond.declaredCreatorWallets);
        if (current >= bond.declaredRetainedBalance) revert CreatorBalanceStillAtOrAboveFloor();

        bond.status = BondStatus.SLASHED;
        bond.slashedTo = msg.sender;
        uint256 payout = bond.bondAmount;
        bond.bondAmount = 0;

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        if (!success) revert TransferFailed();

        emit BondSlashed(bondId, msg.sender, payout, current, bond.declaredRetainedBalance);
    }

    function refundAfterExpiry(uint256 bondId) external {
        Bond storage bond = bonds[bondId];
        if (bond.status != BondStatus.ACTIVE) revert BondNotActive();
        if (msg.sender != bond.creator) revert NotCreator();
        if (block.timestamp < bond.expiresAt + POST_EXPIRY_SLASH_WINDOW) revert BondNotExpired();

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

    function _isDeclaredWalletStorage(address[] storage declaredWallets, address account) internal view returns (bool) {
        for (uint256 i = 0; i < declaredWallets.length; i++) {
            if (declaredWallets[i] == account) {
                return true;
            }
        }
        return false;
    }
}
