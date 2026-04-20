import { promises as fs } from "node:fs";
import path from "node:path";
import { readHunterFeed } from "@/lib/data/hunter-feed";
import { showcaseProof } from "@/lib/data/showcase";

export type HunterRuntimeStatus = {
  runtime: "vps-pm2";
  status: "online" | "stale" | "unknown";
  vaultAddress: string | null;
  lastTickIso: string | null;
  watchedBondIds: string[];
  lastEventLabel: string | null;
  lastEventAtIso: string | null;
  lastResolvedBondId: string | null;
  lastResolvedTxHash: string | null;
};

const onlineWindowMs = 24 * 60 * 60 * 1000;
const defaultStatusPath = path.join(process.cwd(), "agent", "status.runtime.json");
const cleanEnv = (value?: string | null) => value?.trim() || undefined;
const configuredVaultAddress = cleanEnv(process.env.NEXT_PUBLIC_RUG_BOUNTY_VAULT_ADDRESS) || cleanEnv(process.env.RUG_BOUNTY_VAULT_ADDRESS) || null;

export async function getHunterRuntimeStatus(): Promise<HunterRuntimeStatus> {
  try {
    const raw = await fs.readFile((process.env.RUG_HUNTER_STATUS_PATH || defaultStatusPath).trim(), "utf8");
    const parsed = JSON.parse(raw) as {
      runtime?: "vps-pm2";
      status?: "online" | "stale" | "unknown";
      vaultAddress?: string | null;
      lastTickIso?: string | null;
      watchedBondIds?: string[] | null;
      lastResolvedBondId?: string | null;
      lastResolvedTxHash?: string | null;
    };
    const lastTickAt = parsed.lastTickIso ? new Date(parsed.lastTickIso).getTime() : NaN;
    return {
      runtime: parsed.runtime || "vps-pm2",
      status:
        parsed.lastTickIso && Number.isFinite(lastTickAt) && Date.now() - lastTickAt <= onlineWindowMs
          ? "online"
          : parsed.lastTickIso
            ? "stale"
            : parsed.status || "unknown",
      vaultAddress: parsed.vaultAddress ?? null,
      lastTickIso: parsed.lastTickIso ?? null,
      watchedBondIds: parsed.watchedBondIds ?? [],
      lastEventLabel: parsed.lastResolvedBondId ? `bond #${parsed.lastResolvedBondId} was last resolved onchain` : "hunter heartbeat recorded",
      lastEventAtIso: parsed.lastTickIso ?? null,
      lastResolvedBondId: parsed.lastResolvedBondId ?? null,
      lastResolvedTxHash: parsed.lastResolvedTxHash ?? showcaseProof.slashTxHash,
    };
  } catch {
    // fall through to feed-derived status
  }

  const entries = await readHunterFeed();
  const latest = entries[0] ?? null;
  const latestTimestamp = latest ? new Date(latest.createdAtIso).getTime() : NaN;
  const status =
    latest && Number.isFinite(latestTimestamp) && Date.now() - latestTimestamp <= onlineWindowMs
      ? "online"
      : latest
        ? "stale"
        : "unknown";

  const resolvedEntry =
    entries.find((entry) => entry.id.startsWith("live-slash-bond-")) ??
    entries.find((entry) => entry.id.startsWith("slashed-")) ??
    entries.find((entry) => entry.label.toLowerCase().includes("slashed")) ??
    null;

  const resolvedBondId = resolvedEntry
    ? resolvedEntry.id.startsWith("live-slash-bond-")
      ? resolvedEntry.id.split("live-slash-bond-")[1] ?? null
      : resolvedEntry.id.startsWith("slashed-")
        ? resolvedEntry.id.split("slashed-")[1] ?? null
        : null
    : null;

  return {
    runtime: "vps-pm2",
    status,
    vaultAddress: configuredVaultAddress,
    lastTickIso: null,
    watchedBondIds: [],
    lastEventLabel: latest?.label ?? null,
    lastEventAtIso: latest?.createdAtIso ?? null,
    lastResolvedBondId: resolvedBondId,
    lastResolvedTxHash: resolvedEntry?.txHash ?? showcaseProof.slashTxHash,
  };
}
