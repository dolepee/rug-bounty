/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ganache = require("ganache");
const solc = require("solc");
const {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  defineChain,
  keccak256,
  parseEther,
  stringToHex,
} = require("viem");
const { privateKeyToAccount } = require("viem/accounts");

const TOTAL_SUPPLY = 1_000_000_000n * 10n ** 18n;
const FLOOR = 1_050_000n * 10n ** 18n;
const BELOW_FLOOR_BALANCE = 1_000_000n * 10n ** 18n;
const BREACH_TRANSFER_AMOUNT = TOTAL_SUPPLY - BELOW_FLOOR_BALANCE;
const HUNTER_PAYOUT = parseEther("0.8");
const PROTOCOL_PAYOUT = parseEther("0.2");
const PROTOCOL_TREASURY = "0x000000000000000000000000000000000000dEaD";

const compiledArtifacts = compileContracts();

test("createBond stores an active bonded launch with the declared floor", async () => {
  const fixture = await createFixture();
  try {
    const bondId = await createBond(fixture);
    const bond = await fixture.publicClient.readContract({
      address: fixture.vaultAddress,
      abi: fixture.vaultArtifact.abi,
      functionName: "getBond",
      args: [bondId],
    });

    assert.equal(bond.creator.toLowerCase(), fixture.creator.account.address.toLowerCase());
    assert.equal(bond.token.toLowerCase(), fixture.tokenAddress.toLowerCase());
    assert.equal(bond.status, 0);
    assert.equal(bond.breachObserved, false);
    assert.equal(bond.declaredRetainedBalance, FLOOR);
    assert.equal(bond.bondAmount, parseEther("1"));
  } finally {
    await fixture.close();
  }
});

test("resolveBond slashes with an 80/20 hunter-protocol split when creator balance drops below the floor", async () => {
  const fixture = await createFixture();
  try {
    const bondId = await createBond(fixture);
    await fixture.creator.walletClient.writeContract({
      address: fixture.tokenAddress,
      abi: fixture.tokenArtifact.abi,
      functionName: "transfer",
      args: [fixture.hunter.account.address, BREACH_TRANSFER_AMOUNT],
      account: fixture.creator.account,
    });

    const hash = await fixture.hunter.walletClient.writeContract({
      address: fixture.vaultAddress,
      abi: fixture.vaultArtifact.abi,
      functionName: "resolveBond",
      args: [bondId],
      account: fixture.hunter.account,
    });
    const receipt = await fixture.publicClient.waitForTransactionReceipt({ hash });

    const bond = await fixture.publicClient.readContract({
      address: fixture.vaultAddress,
      abi: fixture.vaultArtifact.abi,
      functionName: "getBond",
      args: [bondId],
    });
    assert.equal(bond.status, 1);
    assert.equal(bond.slashedTo.toLowerCase(), fixture.hunter.account.address.toLowerCase());
    assert.equal(bond.bondAmount, 0n);
    assert.equal(bond.breachObserved, true);

    const slashLog = receipt.logs.find((entry) => {
      try {
        const decoded = decodeEventLog({
          abi: fixture.vaultArtifact.abi,
          data: entry.data,
          topics: entry.topics,
        });
        return decoded.eventName === "BondSlashed";
      } catch {
        return false;
      }
    });
    const decodedSlashLog = decodeEventLog({
      abi: fixture.vaultArtifact.abi,
      data: slashLog.data,
      topics: slashLog.topics,
    });
    assert.equal(decodedSlashLog.args.hunterPayout, HUNTER_PAYOUT);
    assert.equal(decodedSlashLog.args.protocolPayout, PROTOCOL_PAYOUT);
    assert.equal(await fixture.publicClient.getBalance({ address: PROTOCOL_TREASURY }), PROTOCOL_PAYOUT);
  } finally {
    await fixture.close();
  }
});

test("resolveBond reverts when a declared creator wallet tries to self-hunt", async () => {
  const fixture = await createFixture();
  try {
    const bondId = await createBond(fixture);
    await fixture.creator.walletClient.writeContract({
      address: fixture.tokenAddress,
      abi: fixture.tokenArtifact.abi,
      functionName: "transfer",
      args: [fixture.hunter.account.address, BREACH_TRANSFER_AMOUNT],
      account: fixture.creator.account,
    });

    await assert.rejects(
      fixture.creator.walletClient.writeContract({
        address: fixture.vaultAddress,
        abi: fixture.vaultArtifact.abi,
        functionName: "resolveBond",
        args: [bondId],
        account: fixture.creator.account,
      }),
    );
  } finally {
    await fixture.close();
  }
});

test("resolveBond reverts while the creator balance is still above the floor", async () => {
  const fixture = await createFixture();
  try {
    const bondId = await createBond(fixture);
    await assert.rejects(
      fixture.hunter.walletClient.writeContract({
        address: fixture.vaultAddress,
        abi: fixture.vaultArtifact.abi,
        functionName: "resolveBond",
        args: [bondId],
        account: fixture.hunter.account,
      }),
    );
  } finally {
    await fixture.close();
  }
});

test("flagBreach permanently marks the bond and resolveBond still works after the creator rebuys above floor", async () => {
  const fixture = await createFixture();
  try {
    const bondId = await createBond(fixture, { expiresInSeconds: 120 });
    await fixture.creator.walletClient.writeContract({
      address: fixture.tokenAddress,
      abi: fixture.tokenArtifact.abi,
      functionName: "transfer",
      args: [fixture.outsider.account.address, BREACH_TRANSFER_AMOUNT],
      account: fixture.creator.account,
    });

    const flagHash = await fixture.hunter.walletClient.writeContract({
      address: fixture.vaultAddress,
      abi: fixture.vaultArtifact.abi,
      functionName: "flagBreach",
      args: [bondId],
      account: fixture.hunter.account,
    });
    await fixture.publicClient.waitForTransactionReceipt({ hash: flagHash });

    await fixture.outsider.walletClient.writeContract({
      address: fixture.tokenAddress,
      abi: fixture.tokenArtifact.abi,
      functionName: "transfer",
      args: [fixture.creator.account.address, BREACH_TRANSFER_AMOUNT],
      account: fixture.outsider.account,
    });

    await fixture.provider.request({ method: "evm_increaseTime", params: [13 * 60] });
    await fixture.provider.request({ method: "evm_mine", params: [] });

    const slashHash = await fixture.hunter.walletClient.writeContract({
      address: fixture.vaultAddress,
      abi: fixture.vaultArtifact.abi,
      functionName: "resolveBond",
      args: [bondId],
      account: fixture.hunter.account,
    });
    await fixture.publicClient.waitForTransactionReceipt({ hash: slashHash });

    const bond = await fixture.publicClient.readContract({
      address: fixture.vaultAddress,
      abi: fixture.vaultArtifact.abi,
      functionName: "getBond",
      args: [bondId],
    });
    assert.equal(bond.status, 1);
    assert.equal(bond.breachObserved, true);
    assert.equal(bond.slashedTo.toLowerCase(), fixture.hunter.account.address.toLowerCase());
  } finally {
    await fixture.close();
  }
});

test("refundAfterExpiry returns the bond to the creator after expiry", async () => {
  const fixture = await createFixture();
  try {
    const bondId = await createBond(fixture, { expiresInSeconds: 120 });
    await fixture.provider.request({ method: "evm_increaseTime", params: [12 * 60] });
    await fixture.provider.request({ method: "evm_mine", params: [] });

    const hash = await fixture.creator.walletClient.writeContract({
      address: fixture.vaultAddress,
      abi: fixture.vaultArtifact.abi,
      functionName: "refundAfterExpiry",
      args: [bondId],
      account: fixture.creator.account,
    });
    await fixture.publicClient.waitForTransactionReceipt({ hash });

    const bond = await fixture.publicClient.readContract({
      address: fixture.vaultAddress,
      abi: fixture.vaultArtifact.abi,
      functionName: "getBond",
      args: [bondId],
    });
    assert.equal(bond.status, 2);
    assert.equal(bond.bondAmount, 0n);
  } finally {
    await fixture.close();
  }
});

test("resolveBond still works during the post-expiry grace window before refund unlock", async () => {
  const fixture = await createFixture();
  try {
    const bondId = await createBond(fixture, { expiresInSeconds: 120 });
    await fixture.creator.walletClient.writeContract({
      address: fixture.tokenAddress,
      abi: fixture.tokenArtifact.abi,
      functionName: "transfer",
      args: [fixture.outsider.account.address, BREACH_TRANSFER_AMOUNT],
      account: fixture.creator.account,
    });
    await fixture.provider.request({ method: "evm_increaseTime", params: [180] });
    await fixture.provider.request({ method: "evm_mine", params: [] });

    const hash = await fixture.hunter.walletClient.writeContract({
      address: fixture.vaultAddress,
      abi: fixture.vaultArtifact.abi,
      functionName: "resolveBond",
      args: [bondId],
      account: fixture.hunter.account,
    });
    await fixture.publicClient.waitForTransactionReceipt({ hash });

    const bond = await fixture.publicClient.readContract({
      address: fixture.vaultAddress,
      abi: fixture.vaultArtifact.abi,
      functionName: "getBond",
      args: [bondId],
    });
    assert.equal(bond.status, 1);
    assert.equal(bond.breachObserved, true);
  } finally {
    await fixture.close();
  }
});

test("refundAfterExpiry reverts once a bond has already been slashed", async () => {
  const fixture = await createFixture();
  try {
    const bondId = await createBond(fixture, { expiresInSeconds: 120 });
    await fixture.creator.walletClient.writeContract({
      address: fixture.tokenAddress,
      abi: fixture.tokenArtifact.abi,
      functionName: "transfer",
      args: [fixture.hunter.account.address, BREACH_TRANSFER_AMOUNT],
      account: fixture.creator.account,
    });
    const slashHash = await fixture.hunter.walletClient.writeContract({
      address: fixture.vaultAddress,
      abi: fixture.vaultArtifact.abi,
      functionName: "resolveBond",
      args: [bondId],
      account: fixture.hunter.account,
    });
    await fixture.publicClient.waitForTransactionReceipt({ hash: slashHash });
    await fixture.provider.request({ method: "evm_increaseTime", params: [180] });
    await fixture.provider.request({ method: "evm_mine", params: [] });

    await assert.rejects(
      fixture.creator.walletClient.writeContract({
        address: fixture.vaultAddress,
        abi: fixture.vaultArtifact.abi,
        functionName: "refundAfterExpiry",
        args: [bondId],
        account: fixture.creator.account,
      }),
    );
  } finally {
    await fixture.close();
  }
});

test("refundAfterExpiry reverts after a flagged breach even if the creator rebuys above floor", async () => {
  const fixture = await createFixture();
  try {
    const bondId = await createBond(fixture, { expiresInSeconds: 120 });
    await fixture.creator.walletClient.writeContract({
      address: fixture.tokenAddress,
      abi: fixture.tokenArtifact.abi,
      functionName: "transfer",
      args: [fixture.outsider.account.address, BREACH_TRANSFER_AMOUNT],
      account: fixture.creator.account,
    });

    const flagHash = await fixture.hunter.walletClient.writeContract({
      address: fixture.vaultAddress,
      abi: fixture.vaultArtifact.abi,
      functionName: "flagBreach",
      args: [bondId],
      account: fixture.hunter.account,
    });
    await fixture.publicClient.waitForTransactionReceipt({ hash: flagHash });

    await fixture.outsider.walletClient.writeContract({
      address: fixture.tokenAddress,
      abi: fixture.tokenArtifact.abi,
      functionName: "transfer",
      args: [fixture.creator.account.address, BREACH_TRANSFER_AMOUNT],
      account: fixture.outsider.account,
    });

    await fixture.provider.request({ method: "evm_increaseTime", params: [13 * 60] });
    await fixture.provider.request({ method: "evm_mine", params: [] });

    await assert.rejects(
      fixture.creator.walletClient.writeContract({
        address: fixture.vaultAddress,
        abi: fixture.vaultArtifact.abi,
        functionName: "refundAfterExpiry",
        args: [bondId],
        account: fixture.creator.account,
      }),
    );
  } finally {
    await fixture.close();
  }
});

test("createBond reverts when the bond amount is below the minimum", async () => {
  const fixture = await createFixture();
  try {
    await assert.rejects(
      createBond(fixture, {
        bondAmount: parseEther("0.001"),
      }),
    );
  } finally {
    await fixture.close();
  }
});

test("createBond reverts when the declared creator wallet list contains duplicates", async () => {
  const fixture = await createFixture();
  try {
    await assert.rejects(
      createBond(fixture, {
        declaredCreatorWallets: [fixture.creator.account.address, fixture.creator.account.address],
      }),
    );
  } finally {
    await fixture.close();
  }
});

async function createFixture() {
  const provider = ganache.provider({
    chain: { chainId: 31337 },
    wallet: {
      totalAccounts: 3,
      defaultBalance: 1000,
    },
    logging: {
      quiet: true,
    },
  });
  const chain = defineChain({
    id: 31337,
    name: "Ganache",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["http://127.0.0.1:31337"] } },
  });

  const transport = custom(provider);
  const publicClient = createPublicClient({ chain, transport });
  const accounts = Object.values(provider.getInitialAccounts());
  const creator = makeWallet(chain, transport, accounts[0].secretKey);
  const hunter = makeWallet(chain, transport, accounts[1].secretKey);
  const outsider = makeWallet(chain, transport, accounts[2].secretKey);

  const tokenAddress = await deployContract(publicClient, creator.walletClient, compiledArtifacts.tokenArtifact, [
    "MockBibi",
    "MBIBI",
    TOTAL_SUPPLY,
    creator.account.address,
  ]);
  const vaultAddress = await deployContract(publicClient, creator.walletClient, compiledArtifacts.vaultArtifact, []);

  return {
    provider,
    chain,
    publicClient,
    creator,
    hunter,
    outsider,
    tokenAddress,
    vaultAddress,
    tokenArtifact: compiledArtifacts.tokenArtifact,
    vaultArtifact: compiledArtifacts.vaultArtifact,
    async close() {
      if (typeof provider.disconnect === "function") {
        await provider.disconnect();
      }
    },
  };
}

async function createBond(fixture, options = {}) {
  const block = await fixture.publicClient.getBlock();
  const launchTimestamp = Number(block.timestamp);
  const expiresInSeconds = options.expiresInSeconds ?? 3600;
  const bondAmount = options.bondAmount ?? parseEther("1");
  const declaredCreatorWallets = options.declaredCreatorWallets ?? [fixture.creator.account.address];
  const hash = await fixture.creator.walletClient.writeContract({
    address: fixture.vaultAddress,
    abi: fixture.vaultArtifact.abi,
    functionName: "createBond",
    args: [
      fixture.tokenAddress,
      "0x" + "11".repeat(32),
      BigInt(launchTimestamp),
      declaredCreatorWallets,
      FLOOR,
      "I will hold at least 1.05M tokens.",
      keccak256(stringToHex("CREATOR_WALLET_FLOOR")),
      BigInt(launchTimestamp + expiresInSeconds),
    ],
    value: bondAmount,
    account: fixture.creator.account,
  });
  const receipt = await fixture.publicClient.waitForTransactionReceipt({ hash });
  const log = receipt.logs.find((entry) => {
    try {
      const decoded = decodeEventLog({
        abi: fixture.vaultArtifact.abi,
        data: entry.data,
        topics: entry.topics,
      });
      return decoded.eventName === "BondCreated";
    } catch {
      return false;
    }
  });

  const decoded = decodeEventLog({
    abi: fixture.vaultArtifact.abi,
    data: log.data,
    topics: log.topics,
  });
  return decoded.args.bondId;
}

async function deployContract(publicClient, walletClient, artifact, args) {
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args,
    account: walletClient.account,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt.contractAddress;
}

function makeWallet(chain, transport, secretKey) {
  const account = privateKeyToAccount(secretKey);
  return {
    account,
    walletClient: createWalletClient({
      account,
      chain,
      transport,
    }),
  };
}

function compileContracts() {
  const vaultSource = fs.readFileSync(path.join(__dirname, "..", "contracts", "RugBountyVault.sol"), "utf8");
  const mockTokenSource = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply, address _owner) {
        name = _name;
        symbol = _symbol;
        totalSupply = _initialSupply;
        balanceOf[_owner] = _initialSupply;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}`;

  const input = {
    language: "Solidity",
    sources: {
      "RugBountyVault.sol": { content: vaultSource },
      "MockERC20.sol": { content: mockTokenSource },
    },
    settings: {
      evmVersion: "paris",
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors?.some((entry) => entry.severity === "error")) {
    throw new Error(output.errors.map((entry) => entry.formattedMessage).join("\n"));
  }

  return {
    vaultArtifact: {
      abi: output.contracts["RugBountyVault.sol"].RugBountyVault.abi,
      bytecode: `0x${output.contracts["RugBountyVault.sol"].RugBountyVault.evm.bytecode.object}`,
    },
    tokenArtifact: {
      abi: output.contracts["MockERC20.sol"].MockERC20.abi,
      bytecode: `0x${output.contracts["MockERC20.sol"].MockERC20.evm.bytecode.object}`,
    },
  };
}
