import { promises as fs } from "node:fs";
import path from "node:path";
import {
  archivedProof,
  currentRefundProof,
  currentSlashProof,
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
      id: "proof-refund-live-1",
      label: "verified proof: bond #1 refunded cleanly on the burn-address vault",
      txHash: currentRefundProof.refundTxHash,
      createdAtIso: currentRefundProof.refundedAtIso,
      source: "verified-proof",
      tone: "lime",
      bondId: currentRefundProof.bondId,
    },
    {
      id: "proof-watch-live-1",
      label: "verified proof: bond #1 held above floor through expiry on the burn-address vault",
      txHash: currentRefundProof.bondTxHash,
      createdAtIso: currentRefundProof.bondedAtIso,
      source: "verified-proof",
      tone: "yellow",
      bondId: currentRefundProof.bondId,
    },
    {
      id: "proof-slash-live-0",
      label: "verified proof: bond #0 slashed on the burn-address vault",
      txHash: currentSlashProof.slashTxHash,
      createdAtIso: currentSlashProof.slashedAtIso,
      source: "verified-proof",
      tone: "red",
      bondId: currentSlashProof.bondId,
    },
    {
      id: "proof-flag-live-0",
      label: "verified proof: floor breach flagged for bond #0 on the burn-address vault",
      txHash: currentSlashProof.breachFlagTxHash,
      createdAtIso: currentSlashProof.breachFlaggedAtIso,
      source: "verified-proof",
      tone: "red",
      bondId: currentSlashProof.bondId,
    },
    {
      id: "proof-watch-live-0",
      label: "verified proof: watcher detected bond #0 on the burn-address vault",
      txHash: currentSlashProof.bondTxHash,
      createdAtIso: currentSlashProof.bondedAtIso,
      source: "verified-proof",
      tone: "yellow",
      bondId: currentSlashProof.bondId,
    },
    {
      id: "proof-archived-frfd",
      label: "legacy proof: earlier refund chain remains public on the previous vault",
      txHash: "0x18c2cc2b0205c21dc304ae2872a9bb6ce9b3aad54ecce765d27efe11d331103f",
      createdAtIso: "2026-04-20T21:19:49.000Z",
      source: "verified-proof",
      tone: "muted",
      bondId: "archived-frfd",
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
