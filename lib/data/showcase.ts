import { getBrokenOaths, getAllBonds, getBondById, type BondRecord } from "@/lib/data/store";
import { getLiveBondById, type LiveBondRecord } from "@/lib/data/live-bonds";

export const showcaseProof = {
  bondId: "0",
  launchTxHash: "0x5807db9c9364698bbc733511711993dfb157fa5b7e8bfaa171aceb315f72b77a",
  bondTxHash: "0xad162b3bd5458ee8fb7f80f1b116fbb5b7d968e4bd5ebaaeda10711bb8168b7b",
  slashTxHash: "0x330410878d8a8df262885f4c8ee5b4c2caf3dbc30a42e2ee39c1eec48f2e5691",
  originalBondAmountBnb: "0.002",
};

export type ShowcaseBond = (BondRecord | LiveBondRecord) & {
  bondTxHash?: string;
  slashTxHash?: string;
};

export async function getPrimaryShowcaseBond(): Promise<ShowcaseBond | null> {
  const live = await getLiveBondById(showcaseProof.bondId);
  if (!live) {
    return null;
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
  return live ? [live] : getAllBonds();
}

export async function getBrokenOathBonds(): Promise<ShowcaseBond[]> {
  const live = await getPrimaryShowcaseBond();
  const fallback = getBrokenOaths().filter((bond) => bond.id !== "moonchad");
  if (live?.status === "SLASHED") {
    return [live, ...fallback];
  }
  return getBrokenOaths();
}

export async function getBondForPage(id: string): Promise<ShowcaseBond | undefined> {
  if (id === showcaseProof.bondId) {
    return (await getPrimaryShowcaseBond()) || undefined;
  }
  return getBondById(id);
}
