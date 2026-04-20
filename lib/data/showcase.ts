import type { Address, Hex } from "viem";
import { getLiveBondById, type LiveBondRecord } from "@/lib/data/live-bonds";

export const showcaseProof = {
  bondId: "0",
  launchTxHash: "0x9dffb11791807de1d0ef3ebd81a5df68bb6fab9fdaad1118615d42b11ab0c1b9" as Hex,
  bondTxHash: "0x9a124548380e3b37efbe9b6fb6f6b34f4b78c496d1709ad1b3aaf00eda3a09a2" as Hex,
  slashTxHash: "0x2f97af4957253462db7e33b6b24069da090a63a03b5310fca7b95fe80249b4e2" as Hex,
  originalBondAmountBnb: "0.003",
  launchedAtIso: "2026-04-20T20:40:14.000Z",
  bondedAtIso: "2026-04-20T20:44:14.000Z",
  slashedAtIso: "2026-04-20T20:47:04.000Z",
};

export const refundProof = {
  bondId: "1",
  launchTxHash: "0xaaf8cd23968cdcab641e522b0b09c771a660940bdae46e514a2bca9f06da25b4" as Hex,
  bondTxHash: "0x4fa2340dbe8fb66e0af83053d596354efd805b5594483356aa044435a1b8af28" as Hex,
  refundTxHash: "0x18c2cc2b0205c21dc304ae2872a9bb6ce9b3aad54ecce765d27efe11d331103f" as Hex,
  originalBondAmountBnb: "0.005",
  launchedAtIso: "2026-04-20T20:53:35.000Z",
  bondedAtIso: "2026-04-20T20:56:12.000Z",
  refundedAtIso: "2026-04-20T21:19:49.000Z",
};

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
  bondTxHash?: string;
  slashTxHash?: string;
  refundTxHash?: string;
};

export type PublicHunterFeedEntry = {
  id: string;
  label: string;
  txHash?: string;
  createdAtIso: string;
};

const staticShowcaseBond: ShowcaseBond = {
  id: "0",
  tokenName: "FinalSlash",
  ticker: "$FSLH",
  tokenAddress: "0xC6E7AC592b1622a76C12e07dA82675E5d64a4444" as Address,
  creator: "0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address,
  declaredCreatorWallets: ["0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address],
  bondAmountBnb: showcaseProof.originalBondAmountBnb,
  declaredFloor: "1050000",
  currentBalance: "1026124.687221308",
  status: "SLASHED",
  expiresAtIso: "2026-04-20T20:55:14.000Z",
  launchTxHash: showcaseProof.launchTxHash,
  notes: "Live BNB mainnet bond on the final vault that was launched, bonded, breached, flagged, and slashed by the Rug Hunter Agent.",
  bondTxHash: showcaseProof.bondTxHash,
  slashTxHash: showcaseProof.slashTxHash,
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
  notes: "Archived first-pass mainnet proof from the legacy vault. Kept in the directory as real history, not the active audited showcase.",
  bondTxHash: archivedProof.bondTxHash,
  slashTxHash: archivedProof.slashTxHash,
};

const staticRefundBond: ShowcaseBond = {
  id: "1",
  tokenName: "FinalRefund",
  ticker: "$FRFD",
  tokenAddress: "0x116aE2FA9068459938443f667E387e1794734444" as Address,
  creator: "0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address,
  declaredCreatorWallets: ["0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address],
  bondAmountBnb: refundProof.originalBondAmountBnb,
  declaredFloor: "1050000",
  currentBalance: "1206124.687221308",
  status: "REFUNDED",
  expiresAtIso: "2026-04-20T21:08:35.000Z",
  launchTxHash: refundProof.launchTxHash,
  notes: "Live BNB mainnet bond on the final vault that stayed above floor, survived the hunter window, and refunded cleanly to the creator.",
  bondTxHash: refundProof.bondTxHash,
  refundTxHash: refundProof.refundTxHash,
};

export async function getPrimaryShowcaseBond(): Promise<ShowcaseBond | null> {
  return staticShowcaseBond;
}

export async function getRefundShowcaseBond(): Promise<ShowcaseBond | null> {
  return staticRefundBond;
}

export async function getCurrentMainnetProofs(): Promise<ShowcaseBond[]> {
  const [slashProofBond, refundProofBond] = await Promise.all([getPrimaryShowcaseBond(), getRefundShowcaseBond()]);
  return [slashProofBond, refundProofBond].filter((bond): bond is ShowcaseBond => Boolean(bond));
}

export async function getDirectoryBonds(): Promise<ShowcaseBond[]> {
  const currentProofs = await getCurrentMainnetProofs();
  return [...currentProofs, archivedShowcaseBond];
}

export async function getBrokenOathBonds(): Promise<ShowcaseBond[]> {
  const live = await getPrimaryShowcaseBond();
  return live?.status === "SLASHED" ? [live, archivedShowcaseBond] : [staticShowcaseBond, archivedShowcaseBond];
}

export async function getBondForPage(id: string): Promise<ShowcaseBond | undefined> {
  if (id === showcaseProof.bondId) return staticShowcaseBond;
  if (id === refundProof.bondId) return staticRefundBond;
  if (id === archivedProof.bondId) return archivedShowcaseBond;

  const live = await getLiveBondById(id);
  if (!live) {
    return undefined;
  }

  return live;
}

export async function getPublicHunterFeed(): Promise<PublicHunterFeedEntry[]> {
  const live = await getPrimaryShowcaseBond();
  if (!live) {
    return [];
  }

  return [
    {
      id: "watching-live-bond-0",
      label: "watching bond #0 on BNB mainnet",
      txHash: showcaseProof.bondTxHash,
      createdAtIso: showcaseProof.bondedAtIso,
    },
    {
      id: "live-breach-bond-0",
      label: `floor breach detected for bond #0 (${live.ticker})`,
      txHash: live.launchTxHash,
      createdAtIso: showcaseProof.slashedAtIso,
    },
    {
      id: "live-slash-bond-0",
      label: "bond #0 slashed to Rug Hunter Agent",
      txHash: showcaseProof.slashTxHash,
      createdAtIso: showcaseProof.slashedAtIso,
    },
  ];
}
