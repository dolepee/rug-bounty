import { promises as fs } from "node:fs";
import path from "node:path";
import {
  archivedProof,
  refundProof,
  showcaseProof,
  type PublicHunterFeedEntry,
} from "@/lib/data/showcase";

const DEFAULT_FEED_PATH = path.join(process.cwd(), "agent", "feed.json");

export function getHunterFeedPath() {
  return (process.env.RUG_HUNTER_FEED_PATH || DEFAULT_FEED_PATH).trim();
}

function sortFeedEntries(entries: PublicHunterFeedEntry[]) {
  return [...entries].sort((left, right) => new Date(right.createdAtIso).getTime() - new Date(left.createdAtIso).getTime());
}

export function getVerifiedProofHistory(): PublicHunterFeedEntry[] {
  return sortFeedEntries([
    {
      id: "proof-watch-1",
      label: "verified proof: watcher tracked bond #1 through expiry window",
      txHash: refundProof.bondTxHash,
      createdAtIso: refundProof.bondedAtIso,
      source: "verified-proof",
      tone: "yellow",
      bondId: refundProof.bondId,
    },
    {
      id: "proof-refund-1",
      label: "verified proof: bond #1 refunded cleanly after grace window",
      txHash: refundProof.refundTxHash,
      createdAtIso: refundProof.refundedAtIso,
      source: "verified-proof",
      tone: "lime",
      bondId: refundProof.bondId,
    },
    {
      id: "proof-watch-0",
      label: "verified proof: watcher detected bond #0 on BNB mainnet",
      txHash: showcaseProof.bondTxHash,
      createdAtIso: showcaseProof.bondedAtIso,
      source: "verified-proof",
      tone: "yellow",
      bondId: showcaseProof.bondId,
    },
    {
      id: "proof-flag-0",
      label: "verified proof: floor breach flagged for bond #0",
      txHash: showcaseProof.breachFlagTxHash,
      createdAtIso: showcaseProof.breachFlaggedAtIso,
      source: "verified-proof",
      tone: "red",
      bondId: showcaseProof.bondId,
    },
    {
      id: "proof-slash-0",
      label: "verified proof: bond #0 slashed by public hunter in permissionless race",
      txHash: showcaseProof.slashTxHash,
      createdAtIso: showcaseProof.slashedAtIso,
      source: "verified-proof",
      tone: "red",
      bondId: showcaseProof.bondId,
    },
    {
      id: "proof-archived-bibi",
      label: "archived proof: earlier BNB mainnet slash recorded on legacy vault",
      txHash: archivedProof.slashTxHash,
      createdAtIso: archivedProof.slashedAtIso,
      source: "verified-proof",
      tone: "red",
      bondId: archivedProof.bondId,
    },
  ]);
}

export async function readRuntimeHunterFeed(): Promise<PublicHunterFeedEntry[]> {
  try {
    const raw = await fs.readFile(getHunterFeedPath(), "utf8");
    const parsed = JSON.parse(raw) as PublicHunterFeedEntry[];
    const seen = new Set<string>();
    return sortFeedEntries(
      parsed.map((entry) => ({ source: "runtime" as const, ...entry })).filter((entry) => {
        if (seen.has(entry.id)) {
          return false;
        }
        seen.add(entry.id);
        return true;
      }),
    );
  } catch {
    return [];
  }
}

export async function readHunterFeed(): Promise<PublicHunterFeedEntry[]> {
  const runtimeEntries = await readRuntimeHunterFeed();
  const verifiedProofHistory = getVerifiedProofHistory();
  const seen = new Set<string>();
  return sortFeedEntries(
    [...runtimeEntries, ...verifiedProofHistory].filter((entry) => {
      if (seen.has(entry.id)) {
        return false;
      }
      seen.add(entry.id);
      return true;
    }),
  );
}
