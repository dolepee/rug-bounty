import { promises as fs } from "node:fs";
import path from "node:path";
import type { PublicHunterFeedEntry } from "@/lib/data/showcase";

const DEFAULT_FEED_PATH = path.join(process.cwd(), "agent", "feed.json");

export function getHunterFeedPath() {
  return (process.env.RUG_HUNTER_FEED_PATH || DEFAULT_FEED_PATH).trim();
}

function sortFeedEntries(entries: PublicHunterFeedEntry[]) {
  return [...entries].sort((left, right) => new Date(right.createdAtIso).getTime() - new Date(left.createdAtIso).getTime());
}

export async function readHunterFeed(): Promise<PublicHunterFeedEntry[]> {
  try {
    const raw = await fs.readFile(getHunterFeedPath(), "utf8");
    const parsed = JSON.parse(raw) as PublicHunterFeedEntry[];
    const seen = new Set<string>();
    return sortFeedEntries(
      parsed.filter((entry) => {
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
