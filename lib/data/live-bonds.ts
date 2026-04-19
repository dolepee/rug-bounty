import { formatEther, formatUnits, getAddress, zeroAddress, type Address, type Hex } from "viem";
import { getBscPublicClient } from "@/lib/chain/bsc";
import { erc20MetadataAbi } from "@/lib/chain/erc20";
import { rugBountyVaultAbi } from "@/lib/chain/rug-bounty";

export type LiveBondRecord = {
  id: string;
  tokenName: string;
  ticker: string;
  tokenAddress: Address;
  creator: Address;
  declaredCreatorWallets: Address[];
  bondAmountBnb: string;
  declaredFloor: string;
  currentBalance: string;
  status: "ACTIVE" | "AT_RISK" | "SLASHED" | "REFUNDED";
  expiresAtIso: string;
  launchTxHash: Hex;
  notes: string;
};

export function getConfiguredVaultAddress(): Address | null {
  const raw = process.env.NEXT_PUBLIC_RUG_BOUNTY_VAULT_ADDRESS || process.env.RUG_BOUNTY_VAULT_ADDRESS;
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
  const bond = await client.readContract({
    address: vaultAddress,
    abi: rugBountyVaultAbi,
    functionName: "getBond",
    args: [bondId],
  });

  if (bond.creator === zeroAddress) {
    return null;
  }

  const [currentBalance, name, symbol, decimals] = await Promise.all([
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
  ]);

  const baseStatus = bond.status === 1 ? "SLASHED" : bond.status === 2 ? "REFUNDED" : "ACTIVE";
  const status = baseStatus === "ACTIVE" && currentBalance < bond.declaredRetainedBalance ? "AT_RISK" : baseStatus;

  return {
    id,
    tokenName: name,
    ticker: symbol.startsWith("$") ? symbol : `$${symbol}`,
    tokenAddress: getAddress(bond.token),
    creator: getAddress(bond.creator),
    declaredCreatorWallets: bond.declaredCreatorWallets.map((wallet) => getAddress(wallet)),
    bondAmountBnb: formatEther(bond.bondAmount),
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
}
