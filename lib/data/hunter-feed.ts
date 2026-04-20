import { promises as fs } from "node:fs";
import path from "node:path";
import { getPublicHunterFeed, type PublicHunterFeedEntry } from "@/lib/data/showcase";

const DEFAULT_FEED_PATH = path.join(process.cwd(), "agent", "feed.json");

export function getHunterFeedPath() {
  return (process.env.RUG_HUNTER_FEED_PATH || DEFAULT_FEED_PATH).trim();
}

export async function readHunterFeed(): Promise<PublicHunterFeedEntry[]> {
  const showcaseEntries = await getPublicHunterFeed();
  try {
    const raw = await fs.readFile(getHunterFeedPath(), "utf8");
    const parsed = JSON.parse(raw) as PublicHunterFeedEntry[];
    const merged = [...parsed, ...showcaseEntries];
    const seen = new Set<string>();
    return merged.filter((entry) => {
      if (seen.has(entry.id)) {
        return false;
      }
      seen.add(entry.id);
      return true;
    });
  } catch {
    return showcaseEntries;
  }
}
