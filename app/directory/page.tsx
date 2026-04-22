import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getLegacyArchiveBonds } from "@/lib/data/showcase";
import { getConfiguredVaultAddress, getLiveVaultBonds } from "@/lib/data/live-bonds";

export const dynamic = "force-dynamic";

type StatusVariant = "slashed" | "refunded" | "active";

export default async function DirectoryPage() {
  const [currentVaultBonds, legacyArchiveBonds] = await Promise.all([getLiveVaultBonds(), getLegacyArchiveBonds()]);
  const currentVaultAddress = getConfiguredVaultAddress();
  const archiveSlashedCount = legacyArchiveBonds.filter((bond) => bond.status === "SLASHED").length;
  const archiveRefundedCount = legacyArchiveBonds.filter((bond) => bond.status === "REFUNDED").length;

  return (
    <div>
      <section>
        <div className="warning-stripes warning-stripes--thin" />
        <div className="section-shell py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="label-mono">Proof register</div>
              <h1 className="mt-3 hazard-title--sm">Current vault first. Archive second.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
                The active burn-address vault is the official funded system. Historical receipts stay available below as archive evidence, but they are no longer the primary product path.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatPill label="Current" value={String(currentVaultBonds.length)} dot="yellow" />
              <StatPill label="Archived" value={String(legacyArchiveBonds.length)} dot="muted" />
              <StatPill label="Refunded" value={String(archiveRefundedCount)} dot="lime" />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/broken-oaths" className="btn-outline">
              Open slashed-only view <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="label-mono">Current vault</div>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Fresh funded tests should appear here automatically.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
              This section is driven by the active configured vault, not by static receipt rows. If you create or resolve a bond on the current vault, it belongs here.
            </p>
          </div>
        </div>

        {currentVaultBonds.length ? (
          <BondTable
            bonds={currentVaultBonds}
            bondHref={(bond) => `/bond/${bond.id}`}
          />
        ) : (
          <div className="mt-6 hazard-card p-6">
            <div className="label-mono">No current-vault receipts yet</div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
              The active vault {currentVaultAddress ? `(${shortenAddress(currentVaultAddress)})` : ""} is ready, but there is no public receipt on the current funded path yet. Run the next funded test through Create, then come back here.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <GuideCard
            title="Official vault"
            body={currentVaultAddress ? `The active funded flow now points to ${shortenAddress(currentVaultAddress)}.` : "The active funded flow is configured in create and judge mode."}
            dot="yellow"
          />
          <GuideCard
            title="Runtime remains live"
            body="Watcher heartbeat and future funded tests should map to the active vault, not to archive receipts."
            dot="yellow"
          />
          <GuideCard
            title="Archive stays visible"
            body={`The earlier proof set remains inspectable as historical evidence. It currently contains ${legacyArchiveBonds.length} public receipts, including ${archiveSlashedCount} slashed outcomes.`}
            dot="muted"
          />
        </div>
      </section>

      <section className="section-shell mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="label-mono">Legacy archive</div>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Earlier public receipts stay available as history.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
              These rows preserve proof-state values from the earlier public vaults. They support credibility, but they should not be mistaken for the active funded system.
            </p>
          </div>
        </div>

        <BondTable
          bonds={legacyArchiveBonds}
          bondHref={(bond) => `/bond/${bond.id}${"bondTxHash" in bond && bond.bondTxHash ? `?bondTxHash=${bond.bondTxHash}` : ""}`}
        />
      </section>

      <div className="mt-14 warning-stripes warning-stripes--thin" />
    </div>
  );
}

function BondTable<T extends { id: string; ticker: string; tokenName: string; bondAmountBnb: string; declaredFloor: string; status: string; expiresAtIso: string }>({
  bonds,
  bondHref,
}: {
  bonds: T[];
  bondHref: (bond: T) => string;
}) {
  return (
    <div className="mt-6 hazard-table">
      <div className="hazard-table__head">
        <div>Token</div>
        <div>Bond</div>
        <div>Floor</div>
        <div>Status</div>
        <div>Expiry</div>
      </div>
      {bonds.map((bond) => (
        <Link key={bond.id} href={bondHref(bond)} className="hazard-table__row">
          <div>
            <div className="flex items-center gap-2">
              <div className="font-display text-lg font-extrabold tracking-tight text-white">
                {bond.ticker}
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-[var(--fg-muted)]">
              {bond.tokenName}
            </div>
          </div>
          <div className="font-mono text-sm text-white/90">
            {Number(bond.bondAmountBnb).toFixed(4)} <span className="text-[var(--fg-muted)]">BNB</span>
          </div>
          <div className="font-mono text-sm text-white/90">{formatNumber(bond.declaredFloor)}</div>
          <div>
            <span className={`status-badge status-badge--${statusVariant(bond.status)}`}>
              <span className={`live-dot live-dot--${statusDot(bond.status)}`} />
              {bond.status}
            </span>
          </div>
          <div className="font-mono text-xs text-[var(--fg-muted)]">
            {new Date(bond.expiresAtIso).toLocaleString()}
          </div>
        </Link>
      ))}
    </div>
  );
}

function StatPill({
  label,
  value,
  dot,
}: {
  label: string;
  value: string;
  dot: "red" | "lime" | "yellow" | "muted";
}) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className={`live-dot live-dot--${dot}`} />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          {label}
        </span>
      </div>
      <div className="mt-1 font-display text-xl font-extrabold text-white">{value}</div>
    </div>
  );
}

function GuideCard({
  title,
  body,
  dot,
}: {
  title: string;
  body: string;
  dot: "yellow" | "muted" | "lime" | "red";
}) {
  return (
    <div className="hazard-card p-5">
      <div className="flex items-center gap-2">
        <span className={`live-dot live-dot--${dot}`} />
        <span className="label-mono">{title}</span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/75">{body}</p>
    </div>
  );
}

function statusVariant(status: string): StatusVariant {
  if (status === "SLASHED") return "slashed";
  if (status === "REFUNDED") return "refunded";
  return "active";
}

function statusDot(status: string): "red" | "lime" | "yellow" {
  if (status === "SLASHED") return "red";
  if (status === "REFUNDED") return "lime";
  return "yellow";
}

function formatNumber(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
