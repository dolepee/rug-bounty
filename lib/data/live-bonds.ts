import { formatEther, formatUnits, getAddress, zeroAddress, type Address, type Hex } from "viem";
import { getBscPublicClient } from "@/lib/chain/bsc";
import { erc20MetadataAbi } from "@/lib/chain/erc20";
import { rugBountyVaultAbi } from "@/lib/chain/rug-bounty";

const cleanEnv = (value?: string | null) => value?.trim() || undefined;
const activeVaultAddress = getAddress("0x8456e375259faab451c6906ba8ac22b1cd8ae1c8");
const knownVaultStartBlocks: Partial<Record<Address, bigint>> = {
  [activeVaultAddress]: 93983877n,
};
const knownLiveBondOrigins: Partial<Record<`${Address}:${string}`, { originalBondAmountBnb: string; bondTxHash: Hex }>> = {
  [`${activeVaultAddress}:0`]: {
    originalBondAmountBnb: "0.003",
    bondTxHash: "0x51da87a3ec3a08a752b65cdd10877c3d7bbd3a090ac89ba52d0aae176f5288a9",
  },
  [`${activeVaultAddress}:1`]: {
    originalBondAmountBnb: "0.005",
    bondTxHash: "0x5c8ea971109c72b5b500f77116673afd1ca1fa9a5ca4f2569bc6aa8c0657af4c",
  },
};

export type LiveBondRecord = {
  id: string;
  tokenName: string;
  ticker: string;
  tokenAddress: Address;
  creator: Address;
  declaredCreatorWallets: Address[];
  bondAmountBnb: string;
  originalBondAmountBnb?: string;
  bondTxHash?: Hex;
  declaredFloor: string;
  currentBalance: string;
  status: "ACTIVE" | "AT_RISK" | "SLASHED" | "REFUNDED";
  expiresAtIso: string;
  launchTxHash: Hex;
  notes: string;
};

const bondCreatedEvent = rugBountyVaultAbi.find((entry) => entry.type === "event" && entry.name === "BondCreated");

function getConfiguredStartBlock(vaultAddress?: Address): bigint | null {
  const raw = cleanEnv(process.env.RUG_BOUNTY_START_BLOCK);
  if (!raw) return null;
  try {
    return BigInt(raw);
  } catch {
    return vaultAddress ? knownVaultStartBlocks[vaultAddress] ?? null : null;
  }
}

export function getConfiguredVaultAddress(): Address | null {
  const raw = cleanEnv(process.env.NEXT_PUBLIC_RUG_BOUNTY_VAULT_ADDRESS) || cleanEnv(process.env.RUG_BOUNTY_VAULT_ADDRESS);
  return raw ? getAddress(raw) : null;
}

export function isNumericBondId(id: string) {
  return /^\d+$/.test(id);
}

export async function getLiveBondById(id: string): Promise<LiveBondRecord | null> {
  if (!isNumericBondId(id)) {
    return null;
  }

  const vaultAddress = getConfiguredVaultAddress();
  if (!vaultAddress) {
    return null;
  }

  const client = getBscPublicClient();
  const bondId = BigInt(id);
  try {
    const bond = await client.readContract({
      address: vaultAddress,
      abi: rugBountyVaultAbi,
      functionName: "getBond",
      args: [bondId],
    });

    if (bond.creator === zeroAddress) {
      return null;
    }

    const [currentBalance, name, symbol, decimals, createdLog] = await Promise.all([
      client.readContract({
        address: vaultAddress,
        abi: rugBountyVaultAbi,
        functionName: "currentCreatorBalance",
        args: [bondId],
      }),
      client.readContract({
        address: bond.token,
        abi: erc20MetadataAbi,
        functionName: "name",
      }),
      client.readContract({
        address: bond.token,
        abi: erc20MetadataAbi,
        functionName: "symbol",
      }),
      client.readContract({
        address: bond.token,
        abi: erc20MetadataAbi,
        functionName: "decimals",
      }),
      getBondCreatedLog(vaultAddress, bondId),
    ]);

    const baseStatus = bond.status === 1 ? "SLASHED" : bond.status === 2 ? "REFUNDED" : "ACTIVE";
    const status = baseStatus === "ACTIVE" && currentBalance < bond.declaredRetainedBalance ? "AT_RISK" : baseStatus;
    const knownOrigin = knownLiveBondOrigins[`${vaultAddress}:${id}`];
    const originalBondAmountBnb =
      createdLog && typeof createdLog.args.bondAmount === "bigint"
        ? formatEther(createdLog.args.bondAmount)
        : knownOrigin?.originalBondAmountBnb;
    const bondTxHash = createdLog?.transactionHash ?? knownOrigin?.bondTxHash;

    return {
      id,
      tokenName: name,
      ticker: symbol.startsWith("$") ? symbol : `$${symbol}`,
      tokenAddress: getAddress(bond.token),
      creator: getAddress(bond.creator),
      declaredCreatorWallets: bond.declaredCreatorWallets.map((wallet) => getAddress(wallet)),
      bondAmountBnb: formatEther(bond.bondAmount),
      ...(originalBondAmountBnb ? { originalBondAmountBnb } : {}),
      ...(bondTxHash ? { bondTxHash } : {}),
      declaredFloor: formatUnits(bond.declaredRetainedBalance, decimals),
      currentBalance: formatUnits(currentBalance, decimals),
      status,
      expiresAtIso: new Date(Number(bond.expiresAt) * 1000).toISOString(),
      launchTxHash: bond.launchTxHash,
      notes:
        status === "SLASHED"
          ? "Live vault state shows this bond already slashed."
          : status === "REFUNDED"
            ? "Live vault state shows this bond refunded after expiry."
            : status === "AT_RISK"
              ? "Live vault state is below the declared floor and can be slashed permissionlessly."
              : "Live vault state is above the declared floor.",
    };
  } catch {
    return null;
  }
}

async function getBondCreatedLog(vaultAddress: Address, bondId: bigint) {
  if (!bondCreatedEvent) {
    return null;
  }

  const startBlock = getConfiguredStartBlock(vaultAddress) ?? knownVaultStartBlocks[vaultAddress] ?? 0n;

  try {
    const logs = await getBscPublicClient().getLogs({
      address: vaultAddress,
      event: bondCreatedEvent,
      args: { bondId },
      fromBlock: startBlock,
      toBlock: "latest",
    });
    return logs[0] ?? null;
  } catch {
    return null;
  }
}

export async function getLiveVaultBonds(): Promise<LiveBondRecord[]> {
  const vaultAddress = getConfiguredVaultAddress();
  if (!vaultAddress) {
    return [];
  }

  const client = getBscPublicClient();

  try {
    const nextBondId = await client.readContract({
      address: vaultAddress,
      abi: rugBountyVaultAbi,
      functionName: "nextBondId",
      args: [],
    });

    if (nextBondId === 0n) {
      return [];
    }

    const ids = Array.from({ length: Number(nextBondId) }, (_, index) => String(Number(nextBondId) - 1 - index));
    const bonds = await Promise.all(ids.map((id) => getLiveBondById(id)));
    return bonds.filter((bond): bond is LiveBondRecord => Boolean(bond));
  } catch {
    return [];
  }
}
