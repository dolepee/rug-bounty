import { createPublicClient, createWalletClient, fallback, getAddress, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const primaryRpc = process.env.BSC_RPC_URL || process.env.NEXT_PUBLIC_BSC_RPC_URL || "https://bsc-rpc.publicnode.com";
const privateKey = process.env.PRIVATE_KEY;
const vaultAddress = process.env.RUG_BOUNTY_VAULT_ADDRESS || process.env.NEXT_PUBLIC_RUG_BOUNTY_VAULT_ADDRESS;
const startBlock = process.env.RUG_BOUNTY_START_BLOCK;
const pollMs = Number(process.env.RUG_HUNTER_POLL_MS || 15000);
const feedPath = (process.env.RUG_HUNTER_FEED_PATH || path.join(process.cwd(), "agent", "feed.json")).trim();
const statusPath = (process.env.RUG_HUNTER_STATUS_PATH || path.join(process.cwd(), "agent", "status.runtime.json")).trim();
const postExpirySlashWindowSeconds = Number(process.env.RUG_HUNTER_POST_EXPIRY_SLASH_WINDOW_SECONDS || 600);
const fallbackRpcs = [
  primaryRpc,
  "https://1rpc.io/bnb",
  "https://bsc-dataseed.bnbchain.org",
  "https://bsc-dataseed-public.bnbchain.org",
];

const rugBountyVaultAbi = [
  {
    type: "function",
    name: "getBond",
    stateMutability: "view",
    inputs: [{ name: "bondId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "creator", type: "address" },
          { name: "token", type: "address" },
          { name: "launchTxHash", type: "bytes32" },
          { name: "launchTimestamp", type: "uint256" },
          { name: "declaredCreatorWallets", type: "address[]" },
          { name: "declaredRetainedBalance", type: "uint256" },
          { name: "bondAmount", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "expiresAt", type: "uint256" },
          { name: "oathHash", type: "bytes32" },
          { name: "rulesHash", type: "bytes32" },
          { name: "breachObserved", type: "bool" },
          { name: "status", type: "uint8" },
          { name: "slashedTo", type: "address" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "currentCreatorBalance",
    stateMutability: "view",
    inputs: [{ name: "bondId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "flagBreach",
    stateMutability: "nonpayable",
    inputs: [{ name: "bondId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "resolveBond",
    stateMutability: "nonpayable",
    inputs: [{ name: "bondId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "event",
    name: "BondCreated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "bondId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "launchTxHash", type: "bytes32" },
      { indexed: false, name: "launchTimestamp", type: "uint256" },
      { indexed: false, name: "declaredCreatorWallets", type: "address[]" },
      { indexed: false, name: "declaredRetainedBalance", type: "uint256" },
      { indexed: false, name: "bondAmount", type: "uint256" },
      { indexed: false, name: "expiresAt", type: "uint256" },
      { indexed: false, name: "oathText", type: "string" },
      { indexed: false, name: "oathHash", type: "bytes32" },
      { indexed: false, name: "rulesHash", type: "bytes32" },
    ],
  },
];

function createClientTransport() {
  return fallback(
    fallbackRpcs.map((url) =>
      http(url, {
        batch: true,
        retryCount: 1,
        timeout: 15_000,
      }),
    ),
    { rank: false },
  );
}

async function recordFeedEntry(entry) {
  const payload = {
    id: entry.id,
    label: entry.label,
    txHash: entry.txHash,
    createdAtIso: entry.createdAtIso || new Date().toISOString(),
  };

  try {
    await mkdir(path.dirname(feedPath), { recursive: true });
    const existingRaw = await readFile(feedPath, "utf8").catch(() => "[]");
    const existing = JSON.parse(existingRaw);
    const next = [payload, ...existing.filter((item) => item.id !== payload.id)].slice(0, 50);
    await writeFile(feedPath, JSON.stringify(next, null, 2));
  } catch (error) {
    console.error("[rug-hunter] feed-write failed", error);
  }
}

async function writeStatusSnapshot(snapshot) {
  try {
    await mkdir(path.dirname(statusPath), { recursive: true });
    await writeFile(statusPath, JSON.stringify(snapshot, null, 2));
  } catch (error) {
    console.error("[rug-hunter] status-write failed", error);
  }
}

async function main() {
  if (!privateKey) {
    throw new Error("Missing PRIVATE_KEY. Fund the generated agent wallet and set it before starting the Rug Hunter.");
  }
  if (!vaultAddress) {
    throw new Error("Missing RUG_BOUNTY_VAULT_ADDRESS. Deploy the vault first.");
  }
  if (!startBlock) {
    throw new Error("Missing RUG_BOUNTY_START_BLOCK. Set it to the block where the vault was deployed.");
  }

  const account = privateKeyToAccount(privateKey);
  const client = createPublicClient({
    chain: bsc,
    transport: createClientTransport(),
  });
  const walletClient = createWalletClient({
    account,
    chain: bsc,
    transport: http(primaryRpc, {
      retryCount: 1,
      timeout: 15_000,
    }),
  });

  const chainId = await client.getChainId();
  const normalizedVaultAddress = getAddress(vaultAddress);
  const activeBondIds = new Set();
  let lastResolvedBondId = null;
  let lastResolvedTxHash = null;

  try {
    const priorStatus = JSON.parse(await readFile(statusPath, "utf8"));
    lastResolvedBondId = priorStatus.lastResolvedBondId ?? null;
    lastResolvedTxHash = priorStatus.lastResolvedTxHash ?? null;
  } catch {
    // no prior status snapshot yet
  }

  console.log(`[rug-hunter] connected to chain ${chainId}`);
  console.log(`[rug-hunter] wallet ${account.address}`);
  console.log(`[rug-hunter] vault ${normalizedVaultAddress}`);
  console.log(`[rug-hunter] scanning from block ${startBlock}`);

  async function refreshActiveBondIds() {
    const logs = await client.getLogs({
      address: normalizedVaultAddress,
      event: rugBountyVaultAbi.find((item) => item.type === "event" && item.name === "BondCreated"),
      fromBlock: BigInt(startBlock),
      toBlock: "latest",
    });

    for (const log of logs) {
      const bondId = log.args.bondId.toString();
      if (!activeBondIds.has(bondId)) {
        await recordFeedEntry({
          id: `watching-${bondId}`,
          label: `watching bond #${bondId} on BNB mainnet`,
          txHash: log.transactionHash,
        });
      }
      activeBondIds.add(bondId);
    }
  }

  async function inspectBond(bondId) {
    const [bond, currentBalance] = await Promise.all([
      client.readContract({
        address: normalizedVaultAddress,
        abi: rugBountyVaultAbi,
        functionName: "getBond",
        args: [BigInt(bondId)],
      }),
      client.readContract({
        address: normalizedVaultAddress,
        abi: rugBountyVaultAbi,
        functionName: "currentCreatorBalance",
        args: [BigInt(bondId)],
      }),
    ]);

    if (bond.status !== 0) {
      activeBondIds.delete(bondId);
      return;
    }

    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now >= bond.expiresAt + BigInt(postExpirySlashWindowSeconds) && !bond.breachObserved) {
      console.log(`[rug-hunter] bond ${bondId} passed the post-expiry hunter window`);
      return;
    }

    if (currentBalance >= bond.declaredRetainedBalance && !bond.breachObserved) {
      console.log(`[rug-hunter] bond ${bondId} intact (${currentBalance} >= ${bond.declaredRetainedBalance})`);
      return;
    }

    if (!bond.breachObserved) {
      console.log(`[rug-hunter] floor breach on bond ${bondId}; submitting flagBreach`);
      await recordFeedEntry({
        id: `breach-${bondId}`,
        label: `floor breach detected for bond #${bondId}`,
      });
      try {
        const flagHash = await walletClient.writeContract({
          address: normalizedVaultAddress,
          abi: rugBountyVaultAbi,
          functionName: "flagBreach",
          args: [BigInt(bondId)],
          account,
        });
        console.log(`[rug-hunter] breach flag tx ${flagHash}`);
        await client.waitForTransactionReceipt({ hash: flagHash });
        await recordFeedEntry({
          id: `flagged-${bondId}`,
          label: `bond #${bondId} permanently marked as breached`,
          txHash: flagHash,
        });
      } catch (error) {
        console.warn(`[rug-hunter] flagBreach race on bond ${bondId}; continuing to resolve`, error);
      }
    }

    console.log(`[rug-hunter] breach locked for bond ${bondId}; submitting resolveBond`);
    const hash = await walletClient.writeContract({
      address: normalizedVaultAddress,
      abi: rugBountyVaultAbi,
      functionName: "resolveBond",
      args: [BigInt(bondId)],
      account,
    });
    console.log(`[rug-hunter] slash tx ${hash}`);
    await client.waitForTransactionReceipt({ hash });
    console.log(`[rug-hunter] slash confirmed for bond ${bondId}`);
    await recordFeedEntry({
      id: `slashed-${bondId}`,
      label: `bond #${bondId} slashed to Rug Hunter Agent`,
      txHash: hash,
    });
    lastResolvedBondId = bondId;
    lastResolvedTxHash = hash;
    activeBondIds.delete(bondId);
  }

  async function tick() {
    await refreshActiveBondIds();
    for (const bondId of Array.from(activeBondIds)) {
      try {
        await inspectBond(bondId);
      } catch (error) {
        console.error(`[rug-hunter] bond ${bondId} failed`, error);
      }
    }
    await writeStatusSnapshot({
      runtime: "vps-pm2",
      status: "online",
      vaultAddress: normalizedVaultAddress,
      lastTickIso: new Date().toISOString(),
      watchedBondIds: Array.from(activeBondIds),
      lastResolvedBondId,
      lastResolvedTxHash,
    });
  }

  await tick();
  setInterval(() => {
    tick().catch((error) => {
      console.error("[rug-hunter] tick failed", error);
    });
  }, pollMs);
}

main().catch((error) => {
  console.error("[rug-hunter] fatal", error);
  process.exit(1);
});
