import type { Address, Hex } from "viem";
import { getLiveBondById, type LiveBondRecord } from "@/lib/data/live-bonds";

export const showcaseProof = {
  bondId: "0",
  launchTxHash: "0x5807db9c9364698bbc733511711993dfb157fa5b7e8bfaa171aceb315f72b77a" as Hex,
  bondTxHash: "0xad162b3bd5458ee8fb7f80f1b116fbb5b7d968e4bd5ebaaeda10711bb8168b7b" as Hex,
  slashTxHash: "0x330410878d8a8df262885f4c8ee5b4c2caf3dbc30a42e2ee39c1eec48f2e5691" as Hex,
  originalBondAmountBnb: "0.002",
  launchedAtIso: "2026-04-19T17:59:18.000Z",
  bondedAtIso: "2026-04-19T18:24:06.000Z",
  slashedAtIso: "2026-04-19T18:30:54.000Z",
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
  tokenName: "Bonded Bibi",
  ticker: "$BIBI",
  tokenAddress: "0x3fc3A064a3Ac78544f642592fDeE208C5be94444" as Address,
  creator: "0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address,
  declaredCreatorWallets: ["0xfB09b732f1A4100A9Dc661Efbc95431B9E2E1810" as Address],
  bondAmountBnb: showcaseProof.originalBondAmountBnb,
  declaredFloor: "1050000",
  currentBalance: "1026124.687221308",
  status: "SLASHED",
  expiresAtIso: "2026-04-19T20:59:18.000Z",
  launchTxHash: showcaseProof.launchTxHash,
  notes: "Live BNB mainnet bond that was launched, bonded, breached, and slashed by the Rug Hunter Agent.",
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
