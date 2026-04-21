import { promises as fs } from "node:fs";
import path from "node:path";
import { readHunterFeed, readRuntimeHunterFeed } from "@/lib/data/hunter-feed";

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

function getConfiguredVaultAddress() {
  return cleanEnv(process.env.NEXT_PUBLIC_RUG_BOUNTY_VAULT_ADDRESS) || cleanEnv(process.env.RUG_BOUNTY_VAULT_ADDRESS) || null;
}

function getRemoteStatusUrl() {
  return cleanEnv(process.env.RUG_HUNTER_STATUS_URL) || null;
}

type HunterStatusSnapshot = {
  runtime?: "vps-pm2";
  status?: "online" | "stale" | "unknown";
  vaultAddress?: string | null;
  lastTickIso?: string | null;
  watchedBondIds?: string[] | null;
  lastResolvedBondId?: string | null;
  lastResolvedTxHash?: string | null;
};

function deriveRuntimeStatus(lastTickIso?: string | null, fallbackStatus?: "online" | "stale" | "unknown") {
  const lastTickAt = lastTickIso ? new Date(lastTickIso).getTime() : NaN;
  return lastTickIso && Number.isFinite(lastTickAt) && Date.now() - lastTickAt <= onlineWindowMs
    ? "online"
    : lastTickIso
      ? "stale"
      : fallbackStatus || "unknown";
}

async function readRemoteStatusSnapshot(): Promise<HunterStatusSnapshot | null> {
  const remoteStatusUrl = getRemoteStatusUrl();
  if (!remoteStatusUrl) {
    return null;
  }

  try {
    const response = await fetch(remoteStatusUrl, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as HunterStatusSnapshot;
  } catch {
    return null;
  }
}

function deriveFeedFields(entries: Awaited<ReturnType<typeof readHunterFeed>>) {
  const latest = entries[0] ?? null;
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
    latest,
    resolvedBondId,
    resolvedTxHash: resolvedEntry?.txHash ?? null,
  };
}

export async function getHunterRuntimeStatus(): Promise<HunterRuntimeStatus> {
  const [publicEntries, runtimeEntries] = await Promise.all([readHunterFeed(), readRuntimeHunterFeed()]);
  const { latest, resolvedBondId, resolvedTxHash } = deriveFeedFields(publicEntries);
  const latestRuntime = runtimeEntries[0] ?? null;
  const configuredVaultAddress = getConfiguredVaultAddress();

  const remote = await readRemoteStatusSnapshot();
  if (remote) {
      return {
        runtime: remote.runtime || "vps-pm2",
        status: deriveRuntimeStatus(remote.lastTickIso, remote.status),
        vaultAddress: remote.vaultAddress ?? configuredVaultAddress,
      lastTickIso: remote.lastTickIso ?? null,
      watchedBondIds: remote.watchedBondIds ?? [],
      lastEventLabel: latestRuntime?.label ?? latest?.label ?? (remote.lastTickIso ? "hunter heartbeat recorded" : null),
      lastEventAtIso: latestRuntime?.createdAtIso ?? latest?.createdAtIso ?? remote.lastTickIso ?? null,
      lastResolvedBondId: resolvedBondId,
      lastResolvedTxHash: resolvedTxHash,
    };
  }

  try {
    const raw = await fs.readFile((process.env.RUG_HUNTER_STATUS_PATH || defaultStatusPath).trim(), "utf8");
    const parsed = JSON.parse(raw) as HunterStatusSnapshot;
    return {
      runtime: parsed.runtime || "vps-pm2",
      status: deriveRuntimeStatus(parsed.lastTickIso, parsed.status),
      vaultAddress: parsed.vaultAddress ?? null,
      lastTickIso: parsed.lastTickIso ?? null,
      watchedBondIds: parsed.watchedBondIds ?? [],
      lastEventLabel: latestRuntime?.label ?? latest?.label ?? (parsed.lastTickIso ? "hunter heartbeat recorded" : null),
      lastEventAtIso: latestRuntime?.createdAtIso ?? latest?.createdAtIso ?? parsed.lastTickIso ?? null,
      lastResolvedBondId: resolvedBondId,
      lastResolvedTxHash: resolvedTxHash,
    };
  } catch {
    // fall through to feed-derived status
  }

  const latestRuntimeTimestamp = latestRuntime ? new Date(latestRuntime.createdAtIso).getTime() : NaN;
  const status =
    latestRuntime && Number.isFinite(latestRuntimeTimestamp) && Date.now() - latestRuntimeTimestamp <= onlineWindowMs
      ? "online"
      : latestRuntime
        ? "stale"
        : "unknown";

  return {
    runtime: "vps-pm2",
    status,
    vaultAddress: configuredVaultAddress,
    lastTickIso: null,
    watchedBondIds: [],
    lastEventLabel: latestRuntime?.label ?? latest?.label ?? null,
    lastEventAtIso: latestRuntime?.createdAtIso ?? latest?.createdAtIso ?? null,
    lastResolvedBondId: resolvedBondId,
    lastResolvedTxHash: resolvedTxHash,
  };
}
