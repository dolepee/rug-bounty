import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getBondForPage } from "@/lib/data/showcase";
import { bscScanAddressUrl, bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";
import { BondActionPanel } from "@/app/bond/[id]/bond-action-panel";
import { BondTimePanel } from "@/app/bond/[id]/bond-time-panel";

type StatusVariant = "slashed" | "refunded" | "active";

export default async function BondDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bondTxHash?: string }>;
}) {
  const { id } = await params;
  const { bondTxHash } = await searchParams;
  const bond = await getBondForPage(id);
  if (!bond) notFound();

  const resolvedBondTxHash = bondTxHash || ("bondTxHash" in bond ? bond.bondTxHash : undefined);
  const slashHash = "slashTxHash" in bond ? bond.slashTxHash : undefined;
  const refundHash = "refundTxHash" in bond ? bond.refundTxHash : undefined;
  const variant = statusVariant(bond.status);

  const bondAmount = Number(bond.bondAmountBnb).toFixed(4);
  const floor = Number(bond.declaredFloor);
  const balance = Number(bond.currentBalance);
  const raw = floor > 0 ? (balance / floor) * 100 : 0;
  const gaugePct = Math.max(0, Math.min(100, raw));
  const gaugeFill = variant === "refunded" ? "lime" : variant === "slashed" ? "red" : "yellow";

  return (
    <div>
      <section>
        <div className="warning-stripes warning-stripes--thin" />
        <div className="section-shell py-10 md:py-14">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--fg-muted)] hover:text-[var(--yellow)]"
          >
            ← Back to receipts
          </Link>

          <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="label-mono">{bond.tokenName}</div>
              <h1 className="mt-2 hazard-title--sm text-white" style={{ color: "#ffffff" }}>
                {bond.ticker}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">{bond.notes}</p>
            </div>
            <span className={`status-badge status-badge--${variant} text-xs`}>
              <span className={`live-dot live-dot--${gaugeFill}`} />
              {bond.status}
            </span>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="hazard-card p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="label-mono">Bond staked</div>
              <div className="giant giant--hero mt-2 text-[var(--yellow)]">
                {bondAmount}
                <span className="ml-2 text-2xl text-white/50">BNB</span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <div className="label-mono">Declared floor</div>
                  <div className="mt-1 font-mono text-sm text-white/90">{formatNumber(bond.declaredFloor)} tokens</div>
                </div>
                <div>
                  <div className="label-mono">Latest balance</div>
                  <div className="mt-1 font-mono text-sm text-white/90">{formatNumber(bond.currentBalance)}</div>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="label-mono">Floor coverage</span>
                  <span className="font-mono text-xs text-white/80">{gaugePct.toFixed(1)}%</span>
                </div>
                <div className="floor-gauge mt-2">
                  <div className={`floor-gauge__fill floor-gauge__fill--${gaugeFill}`} style={{ width: `${gaugePct}%` }} />
                </div>
              </div>
            </div>

            <BondTimePanel
              expiresAtIso={bond.expiresAtIso}
              status={bond.status as "ACTIVE" | "AT_RISK" | "SLASHED" | "REFUNDED"}
            />
          </div>
        </div>
      </section>

      <section className="section-shell mt-6">
        <div className="hazard-card p-6 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div className="label-mono">Receipt trail</div>
            <a
              href={fourMemeTokenUrl(bond.tokenAddress)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--yellow)] hover:text-white"
            >
              Four.Meme page <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <ReceiptPill label="Launch" hash={bond.launchTxHash} kind="neutral" />
            {resolvedBondTxHash ? (
              <ReceiptPill label="Bond" hash={resolvedBondTxHash} kind="yellow" />
            ) : null}
            {slashHash ? <ReceiptPill label="Slash" hash={slashHash} kind="red" /> : null}
            {refundHash ? <ReceiptPill label="Refund" hash={refundHash} kind="lime" /> : null}
          </div>
        </div>
      </section>

      <section className="section-shell mt-6">
        <BondActionPanel
          bondId={bond.id}
          creator={bond.creator}
          status={bond.status as "ACTIVE" | "AT_RISK" | "SLASHED" | "REFUNDED"}
          expiresAtIso={bond.expiresAtIso}
        />
      </section>

      <section className="section-shell mt-6">
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="hazard-card p-6 md:p-8">
            <div className="label-mono">Declared creator wallets</div>
            <div className="mt-5 space-y-3">
              {bond.declaredCreatorWallets.map((wallet) => (
                <div
                  key={wallet}
                  className="flex flex-col gap-3 rounded border border-[var(--border)] bg-white/[0.015] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="font-mono text-sm text-white/90 break-all">{wallet}</div>
                  <a
                    className="btn-outline"
                    href={bscScanAddressUrl(wallet)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    BscScan
                  </a>
                </div>
              ))}
            </div>
          </div>

          <Link href={`/certificate/${bond.id}`} className="hazard-card p-6 md:p-8 group">
            <div className="label-mono text-[var(--yellow)]">Share card</div>
            <h3 className="mt-3 hazard-title--sm">Open certificate.</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              The bond as a shareable receipt: ticker, promise, floor, outcome, proof links.
            </p>
            <div className="mt-5 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--yellow)] group-hover:text-white">
              Render <ArrowUpRight className="h-3 w-3" />
            </div>
          </Link>
        </div>
      </section>

      <div className="mt-14 warning-stripes warning-stripes--thin" />
    </div>
  );
}

function ReceiptPill({
  label,
  hash,
  kind,
}: {
  label: string;
  hash: string;
  kind: "neutral" | "yellow" | "red" | "lime";
}) {
  const dotClass =
    kind === "yellow" ? "yellow" : kind === "red" ? "red" : kind === "lime" ? "lime" : "muted";
  return (
    <a
      href={bscScanTxUrl(hash)}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded border border-[var(--border)] bg-white/[0.015] px-4 py-3 hover:border-[var(--yellow)] hover:bg-[var(--yellow-soft)] transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className={`live-dot live-dot--${dotClass}`} />
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
          {label}
        </span>
      </div>
      <span className="font-mono text-xs text-white/85">
        {hash.slice(0, 6)}…{hash.slice(-4)}
      </span>
    </a>
  );
}

function statusVariant(status: string): StatusVariant {
  if (status === "SLASHED") return "slashed";
  if (status === "REFUNDED") return "refunded";
  return "active";
}

function formatNumber(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(3)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
