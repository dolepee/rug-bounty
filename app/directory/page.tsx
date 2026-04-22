import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getDirectoryBonds } from "@/lib/data/showcase";
import { getConfiguredVaultAddress } from "@/lib/data/live-bonds";

export const dynamic = "force-dynamic";

type StatusVariant = "slashed" | "refunded" | "active";

export default async function DirectoryPage() {
  const bonds = await getDirectoryBonds();
  const currentVaultAddress = getConfiguredVaultAddress();
  const slashedCount = bonds.filter((bond) => bond.status === "SLASHED").length;
  const refundedCount = bonds.filter((bond) => bond.status === "REFUNDED").length;

  return (
    <div>
      <section>
        <div className="warning-stripes warning-stripes--thin" />
        <div className="section-shell py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="label-mono">Historical proof archive</div>
              <h1 className="mt-3 hazard-title--sm">Every bond. Every receipt.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
                Each row points at a real Four.Meme launch, a real bond, and a real onchain outcome. This archive preserves proof-state values from earlier public vaults; current funded tests should use the active vault shown in the create flow and judge packet.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatPill label="Proofs" value={String(bonds.length)} dot="muted" />
              <StatPill label="Slashed" value={String(slashedCount)} dot="red" />
              <StatPill label="Refunded" value={String(refundedCount)} dot="lime" />
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
        <div className="hazard-table">
          <div className="hazard-table__head">
            <div>Token</div>
            <div>Bond</div>
            <div>Floor</div>
            <div>Status</div>
            <div>Expiry</div>
          </div>
          {bonds.map((bond) => (
            <Link
              key={bond.id}
              href={`/bond/${bond.id}${bond.bondTxHash ? `?bondTxHash=${bond.bondTxHash}` : ""}`}
              className="hazard-table__row"
            >
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

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <GuideCard
            title="Archive scope"
            body="These rows are historical public proof chains backed by real tx receipts. They are kept for inspection, not treated as the current funded system."
            dot="muted"
          />
          <GuideCard
            title="Official vault"
            body={currentVaultAddress ? `New funded tests should use ${shortenAddress(currentVaultAddress)}. Proof rows stay anchored to historical evidence.` : "The active vault is shown in create and judge mode."}
            dot="yellow"
          />
          <GuideCard
            title="Runtime remains live"
            body="The watcher heartbeat and current funded flow live on the active vault. Archive receipts remain public so the old proof chain stays auditable."
            dot="yellow"
          />
        </div>
      </section>

      <div className="mt-14 warning-stripes warning-stripes--thin" />
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
