import type { Address, Hex } from "viem";
import { getLiveBondById, type LiveBondRecord } from "@/lib/data/live-bonds";

export const activeProofVaultAddress = "0x8456e375259faab451c6906ba8ac22b1cd8ae1c8" as Address;
export const legacyProofVaultAddress = "0xe010a3457001a0a8a6f2e69cdc962e705dbdedea" as Address;

export const currentSlashProof = {
  bondId: "0",
  launchTxHash: "0x6010645001bc09ed03acf1d6d7491de2c08a95a2dea6c82cb2c10b0edfe88393" as Hex,
  bondTxHash: "0x51da87a3ec3a08a752b65cdd10877c3d7bbd3a090ac89ba52d0aae176f5288a9" as Hex,
  breachFlagTxHash: "0xffab0e03fd7e9ed3a2591598b91feacf66573464f76f0abdc71ca5fd97d72afd" as Hex,
  slashTxHash: "0x766e68b07d852cb155ff23db1c35ab6cf88a8cea8d8ee4a1124c64cef929379f" as Hex,
  originalBondAmountBnb: "0.003",
  launchedAtIso: "2026-04-22T13:18:24.000Z",
  bondedAtIso: "2026-04-22T13:25:03.000Z",
  breachFlaggedAtIso: "2026-04-22T13:29:46.000Z",
  slashedAtIso: "2026-04-22T13:29:47.000Z",
};

export const currentRefundProof = {
  bondId: "1",
  launchTxHash: "0x81ec07789a937f63a9c54e77e43fe7d4d421e26c2bbc807a81a42ed5cabfb05b" as Hex,
  bondTxHash: "0x5c8ea971109c72b5b500f77116673afd1ca1fa9a5ca4f2569bc6aa8c0657af4c" as Hex,
  refundTxHash: "0x395b99e567219b2aa300eaa6a10b716bec70916782a59de36c37623da4b02eb5" as Hex,
  originalBondAmountBnb: "0.005",
  launchedAtIso: "2026-04-22T14:31:11.000Z",
  bondedAtIso: "2026-04-22T14:40:55.000Z",
  refundedAtIso: "2026-04-22T14:56:49.000Z",
};

export const legacySlashProof = {
  bondId: "archived-fslh",
  launchTxHash: "0x9dffb11791807de1d0ef3ebd81a5df68bb6fab9fdaad1118615d42b11ab0c1b9" as Hex,
  bondTxHash: "0x9a124548380e3b37efbe9b6fb6f6b34f4b78c496d1709ad1b3aaf00eda3a09a2" as Hex,
  breachFlagTxHash: "0x35eb0ec84eaf121d454a0b68abc7b7994121f466975505c901ec645fb15f762a" as Hex,
  slashTxHash: "0x6d039369733eaca6d8d9475603449f723c58471577af0efca69565e9e50fed59" as Hex,
  originalBondAmountBnb: "0.003",
  launchedAtIso: "2026-04-20T20:40:14.000Z",
  bondedAtIso: "2026-04-20T20:44:14.000Z",
  breachFlaggedAtIso: "2026-04-20T20:47:03.000Z",
  slashedAtIso: "2026-04-20T20:47:04.000Z",
};

export const legacyRefundProof = {
  bondId: "archived-frfd",
  launchTxHash: "0xaaf8cd23968cdcab641e522b0b09c771a660940bdae46e514a2bca9f06da25b4" as Hex,
  bondTxHash: "0x4fa2340dbe8fb66e0af83053d596354efd805b5594483356aa044435a1b8af28" as Hex,
  refundTxHash: "0x18c2cc2b0205c21dc304ae2872a9bb6ce9b3aad54ecce765d27efe11d331103f" as Hex,
  originalBondAmountBnb: "0.005",
  launchedAtIso: "2026-04-20T20:53:35.000Z",
  bondedAtIso: "2026-04-20T20:56:12.000Z",
  refundedAtIso: "2026-04-20T21:19:49.000Z",
};

export const showcaseProof = legacySlashProof;
export const refundProof = legacyRefundProof;

export const archivedProof = {
  bondId: "archived-bibi",
  launchTxHash: "0x5807db9c9364698bbc733511711993dfb157fa5b7e8bfaa171aceb315f72b77a" as Hex,
  bondTxHash: "0xad162b3bd5458ee8fb7f80f1b116fbb5b7d968e4bd5ebaaeda10711bb8168b7b" as Hex,
  slashTxHash: "0x330410878d8a8df262885f4c8ee5b4c2caf3dbc30a42e2ee39c1eec48f2e5691" as Hex,
  originalBondAmountBnb: "0.002",
  launchedAtIso: "2026-04-19T17:59:18.000Z",
  bondedAtIso: "2026-04-19T18:59:18.000Z",
  slashedAtIso: "2026-04-19T19:04:55.000Z",
};

export type ShowcaseBond = LiveBondRecord & {
  currentBondAmountBnb?: string;
  bondTxHash?: string;
  slashTxHash?: string;
  refundTxHash?: string;
  liveCurrentBalance?: string;
  liveStatus?: LiveBondRecord["status"];
  liveExpiresAtIso?: string;
};

export type PublicHunterFeedEntry = {
  id: string;
  label: string;
  txHash?: string;
  createdAtIso: string;
  source?: "runtime" | "verified-proof";
  tone?: "yellow" | "lime" | "red" | "muted";
  bondId?: string | null;
};

const legacyShowcaseBond: ShowcaseBond = {
  id: legacySlashProof.bondId,
  tokenName: "FinalSlash",
  ticker: "$FSLH",
  tokenAddress: "0xC6E7AC592b1622a76C12e07dA82675E5d64a4444" as Address,
  creator: "0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address,
  declaredCreatorWallets: ["0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address],
  bondAmountBnb: legacySlashProof.originalBondAmountBnb,
  declaredFloor: "1050000",
  currentBalance: "1026124.687221308",
  status: "SLASHED",
  expiresAtIso: "2026-04-20T20:55:14.000Z",
  launchTxHash: legacySlashProof.launchTxHash,
  notes: "Archived BNB mainnet proof from the previous public vault: launched, bonded, breached, flagged by the watcher, and ultimately slashed by a third-party hunter in the permissionless race.",
  bondTxHash: legacySlashProof.bondTxHash,
  slashTxHash: legacySlashProof.slashTxHash,
};

const archivedShowcaseBond: ShowcaseBond = {
  id: archivedProof.bondId,
  tokenName: "Bonded Bibi",
  ticker: "$BIBI",
  tokenAddress: "0x3fc3A064a3Ac78544f642592fDeE208C5be94444" as Address,
  creator: "0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address,
  declaredCreatorWallets: ["0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address],
  bondAmountBnb: archivedProof.originalBondAmountBnb,
  declaredFloor: "1050000",
  currentBalance: "1026124.687221308",
  status: "SLASHED",
  expiresAtIso: "2026-04-19T20:59:18.000Z",
  launchTxHash: archivedProof.launchTxHash,
  notes: "Archived first-pass mainnet proof from the legacy vault. Kept in the directory as real history, not the active verified proof set.",
  bondTxHash: archivedProof.bondTxHash,
  slashTxHash: archivedProof.slashTxHash,
};

const legacyRefundBond: ShowcaseBond = {
  id: legacyRefundProof.bondId,
  tokenName: "FinalRefund",
  ticker: "$FRFD",
  tokenAddress: "0x116aE2FA9068459938443f667E387e1794734444" as Address,
  creator: "0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address,
  declaredCreatorWallets: ["0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address],
  bondAmountBnb: legacyRefundProof.originalBondAmountBnb,
  declaredFloor: "1050000",
  currentBalance: "1206124.687221308",
  status: "REFUNDED",
  expiresAtIso: "2026-04-20T21:08:35.000Z",
  launchTxHash: legacyRefundProof.launchTxHash,
  notes: "Archived BNB mainnet proof from the previous public vault that stayed above floor, survived the hunter window, and refunded cleanly to the creator.",
  bondTxHash: legacyRefundProof.bondTxHash,
  refundTxHash: legacyRefundProof.refundTxHash,
};

export async function getPrimaryShowcaseBond(): Promise<ShowcaseBond | null> {
  return getLiveBondById(currentSlashProof.bondId);
}

export async function getRefundShowcaseBond(): Promise<ShowcaseBond | null> {
  return getLiveBondById(currentRefundProof.bondId);
}

export async function getCurrentMainnetProofs(): Promise<ShowcaseBond[]> {
  const [slashProofBond, refundProofBond] = await Promise.all([getPrimaryShowcaseBond(), getRefundShowcaseBond()]);
  return [slashProofBond, refundProofBond].filter((bond): bond is ShowcaseBond => Boolean(bond));
}

export async function getLegacyArchiveBonds(): Promise<ShowcaseBond[]> {
  return [legacyShowcaseBond, legacyRefundBond, archivedShowcaseBond];
}

export async function getDirectoryBonds(): Promise<ShowcaseBond[]> {
  return getLegacyArchiveBonds();
}

export async function getBrokenOathBonds(): Promise<ShowcaseBond[]> {
  const currentSlashBond = await getPrimaryShowcaseBond();
  return [currentSlashBond, legacyShowcaseBond, archivedShowcaseBond].filter((bond): bond is ShowcaseBond => Boolean(bond));
}

export async function getBondForPage(id: string): Promise<ShowcaseBond | undefined> {
  if (id === legacySlashProof.bondId) return legacyShowcaseBond;
  if (id === legacyRefundProof.bondId) return legacyRefundBond;
  if (id === archivedProof.bondId) return archivedShowcaseBond;

  const live = await getLiveBondById(id);
  if (!live) {
    return undefined;
  }

  return live;
}
