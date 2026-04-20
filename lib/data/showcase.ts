import type { Address, Hex } from "viem";
import { getLiveBondById, type LiveBondRecord } from "@/lib/data/live-bonds";

export const showcaseProof = {
  bondId: "0",
  launchTxHash: "0xdeafcf1faf1afd130f75941aa48ea8d7d9a6bc074cf17cfd7293030aa5d7eea4" as Hex,
  bondTxHash: "0xc642798f5dbf33f6d59b97229fe4f505fa555498121f8329b751a37323ec3f64" as Hex,
  slashTxHash: "0x7ce760c03a4d7a0c4c9ce015402572f13410f8b1b747b57f53142a78910a6534" as Hex,
  originalBondAmountBnb: "0.006",
  launchedAtIso: "2026-04-20T11:43:34.000Z",
  bondedAtIso: "2026-04-20T12:00:38.000Z",
  slashedAtIso: "2026-04-20T12:04:55.000Z",
};

export type ShowcaseBond = LiveBondRecord & {
  bondTxHash?: string;
  slashTxHash?: string;
};

export type PublicHunterFeedEntry = {
  id: string;
  label: string;
  txHash?: string;
  createdAtIso: string;
};

const staticShowcaseBond: ShowcaseBond = {
  id: "0",
  tokenName: "PatchProof",
  ticker: "$PATCH",
  tokenAddress: "0x3f77dD50A1270983cA48d23231aD1a427E964444" as Address,
  creator: "0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address,
  declaredCreatorWallets: ["0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address],
  bondAmountBnb: showcaseProof.originalBondAmountBnb,
  declaredFloor: "1020000",
  currentBalance: "1010062.772865664",
  status: "SLASHED",
  expiresAtIso: "2026-04-20T14:43:21.000Z",
  launchTxHash: showcaseProof.launchTxHash,
  notes: "Live BNB mainnet bond on the patched vault that was launched, bonded, breached, and slashed by the Rug Hunter Agent.",
  bondTxHash: showcaseProof.bondTxHash,
  slashTxHash: showcaseProof.slashTxHash,
};

export async function getPrimaryShowcaseBond(): Promise<ShowcaseBond | null> {
  const live = await getLiveBondById(showcaseProof.bondId);
  if (!live) {
    return staticShowcaseBond;
  }

  return {
    ...live,
    bondAmountBnb: showcaseProof.originalBondAmountBnb,
    bondTxHash: showcaseProof.bondTxHash,
    slashTxHash: showcaseProof.slashTxHash,
  };
}

export async function getDirectoryBonds(): Promise<ShowcaseBond[]> {
  const live = await getPrimaryShowcaseBond();
  return live ? [live] : [staticShowcaseBond];
}

export async function getBrokenOathBonds(): Promise<ShowcaseBond[]> {
  const live = await getPrimaryShowcaseBond();
  return live?.status === "SLASHED" ? [live] : [staticShowcaseBond];
}

export async function getBondForPage(id: string): Promise<ShowcaseBond | undefined> {
  const live = await getLiveBondById(id);
  if (!live) {
    return id === showcaseProof.bondId ? staticShowcaseBond : undefined;
  }

  if (id === showcaseProof.bondId) {
    return {
      ...live,
      bondAmountBnb: showcaseProof.originalBondAmountBnb,
      bondTxHash: showcaseProof.bondTxHash,
      slashTxHash: showcaseProof.slashTxHash,
    };
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
