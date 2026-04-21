import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Bot, ShieldCheck, Sparkles } from "lucide-react";
import {
  getCurrentMainnetProofs,
  getDirectoryBonds,
  refundProof,
  showcaseProof,
  type ShowcaseBond,
} from "@/lib/data/showcase";
import { getHunterRuntimeStatus } from "@/lib/data/hunter-status";
import { bscScanTxUrl } from "@/lib/fourmeme/links";

export const dynamic = "force-dynamic";

type StatusVariant = "slashed" | "refunded" | "active";

export default async function HomePage() {
  const currentProofs = await getCurrentMainnetProofs();
  const bonds = await getDirectoryBonds();
  const hunterStatus = await getHunterRuntimeStatus();

  const slashBond = currentProofs.find((bond) => bond.id === showcaseProof.bondId) ?? null;
  const refundBond = currentProofs.find((bond) => bond.id === refundProof.bondId) ?? null;

  const watched = hunterStatus.watchedBondIds.length;
  const hunterLine =
    hunterStatus.status === "online"
      ? `Hunter online / watching ${watched} ${watched === 1 ? "bond" : "bonds"}`
      : hunterStatus.status === "stale"
        ? "Hunter stale / last tick pending"
        : "Hunter status unknown";

  return (
    <div>
      <section className="hero-hazard">
        <div className="warning-stripes" />
        <div className="section-shell py-16 md:py-22">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">
            <span className={`live-dot live-dot--${hunterStatus.status === "online" ? "lime" : hunterStatus.status === "stale" ? "yellow" : "muted"}`} />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--fg-muted)]">
              Verified mainnet proof set / {hunterLine}
            </span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div>
              <div className="label-mono">Bonded launches for Four.Meme</div>
              <h1 className="hazard-title mt-4 max-w-4xl">
                Turn launch promises into public collateral.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/78 md:text-xl">
                RugBounty lets creators stake BNB behind one explicit launch promise. If the declared floor breaks, anyone can slash the bond onchain. If it holds through expiry and grace, the creator gets refunded.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/create" className="btn-hazard">
                  Create a bonded launch
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
                </Link>
                <Link href="/judge" className="btn-outline">
                  Open judge packet
                </Link>
              </div>

              <div className="mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
                <HeroStat label="Final vault" value={hunterStatus.vaultAddress ? shortenAddress(hunterStatus.vaultAddress) : "unconfigured"} mono />
                <HeroStat label="Outcome proofs" value={`${currentProofs.length} verified`} />
                <HeroStat label="Network" value="BNB mainnet" />
              </div>
            </div>

            <div className="hazard-card p-6 md:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="label-mono">System brief</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                    What reviewers can verify in one pass.
                  </h2>
                </div>
                <span className="status-badge status-badge--active">
                  <span className={`live-dot live-dot--${hunterStatus.status === "online" ? "lime" : "yellow"}`} />
                  {hunterStatus.status}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <SystemRow label="Vault source" value="Verified on BscScan" accent="lime" />
                <SystemRow label="Watcher runtime" value={hunterStatus.lastTickIso ? new Date(hunterStatus.lastTickIso).toLocaleString() : "heartbeat unavailable"} />
                <SystemRow label="Latest event" value={hunterStatus.lastEventLabel ?? "no public event recorded"} />
                <SystemRow label="Slash proof" value={showcaseProof.slashTxHash.slice(0, 10) + "…" + showcaseProof.slashTxHash.slice(-6)} mono accent="red" />
                <SystemRow label="Refund proof" value={refundProof.refundTxHash.slice(0, 10) + "…" + refundProof.refundTxHash.slice(-6)} mono accent="lime" />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <MiniProofCard
                  eyebrow="Failure path"
                  ticker={slashBond?.ticker ?? "$FSLH"}
                  title="Breached floor, flagged, slashed."
                  body="Final vault proof where the creator sold below the declared floor and the bond was taken in the permissionless race."
                  href={slashBond ? `/bond/${slashBond.id}${slashBond.bondTxHash ? `?bondTxHash=${slashBond.bondTxHash}` : ""}` : "/directory"}
                  tone="red"
                />
                <MiniProofCard
                  eyebrow="Success path"
                  ticker={refundBond?.ticker ?? "$FRFD"}
                  title="Held through expiry, refunded cleanly."
                  body="Final vault proof where the balance stayed above floor and the creator reclaimed the bond after the hunter window."
                  href={refundBond ? `/bond/${refundBond.id}${refundBond.bondTxHash ? `?bondTxHash=${refundBond.bondTxHash}` : ""}` : "/directory"}
                  tone="lime"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="warning-stripes" />
      </section>

      <section className="section-shell mt-16 md:mt-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="label-mono">Platform</div>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              A narrower claim. A harder proof.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
              The product is intentionally specific: one public promise, one bonded floor, one onchain consequence path. That is why the proof is credible.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <CapabilityCard
            icon={<ShieldCheck className="h-4 w-4" />}
            eyebrow="Onchain enforcement"
            title="A real bond sits behind the claim."
            body="The verified vault enforces creator wallets, expiry, grace window, slash, and refund. The app prepares the rule; the contract holds the money."
          />
          <CapabilityCard
            icon={<Sparkles className="h-4 w-4" />}
            eyebrow="AI in the loop"
            title="Only the enforceable sentence gets bonded."
            body="The compiler selects the actual enforceable segment, separates it from hype or social promises, and turns it into one machine-checkable oath."
          />
          <CapabilityCard
            icon={<Bot className="h-4 w-4" />}
            eyebrow="Runtime monitoring"
            title="Watcher online, not theoretical."
            body="The VPS hunter tracks active bonds and writes a public heartbeat so judges can inspect the runtime, not just trust a repo claim."
          />
        </div>
      </section>

      <section className="section-shell mt-16 md:mt-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="label-mono">Verified proof set</div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              The final vault has both outcomes on record.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
              Reviewers do not need to imagine the system. The slash path and the refund path are both already public on BNB mainnet.
            </p>
          </div>
          <Link
            href="/directory"
            className="hidden items-center gap-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--fg-muted)] hover:text-white sm:inline-flex"
          >
            View all proofs <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {slashBond ? (
            <BondCard
              bond={slashBond}
              kind="slash"
              primaryTx={{ label: "Slash tx", href: bscScanTxUrl(showcaseProof.slashTxHash), hash: showcaseProof.slashTxHash }}
              trail={[
                { label: "Launch", href: bscScanTxUrl(showcaseProof.launchTxHash), hash: showcaseProof.launchTxHash },
                { label: "Bond", href: bscScanTxUrl(showcaseProof.bondTxHash), hash: showcaseProof.bondTxHash },
                { label: "Flag", href: bscScanTxUrl(showcaseProof.breachFlagTxHash), hash: showcaseProof.breachFlagTxHash },
              ]}
              moment={{ label: "Slashed", iso: showcaseProof.slashedAtIso }}
            />
          ) : null}

          {refundBond ? (
            <BondCard
              bond={refundBond}
              kind="refund"
              primaryTx={{ label: "Refund tx", href: bscScanTxUrl(refundProof.refundTxHash), hash: refundProof.refundTxHash }}
              trail={[
                { label: "Launch", href: bscScanTxUrl(refundProof.launchTxHash), hash: refundProof.launchTxHash },
                { label: "Bond", href: bscScanTxUrl(refundProof.bondTxHash), hash: refundProof.bondTxHash },
              ]}
              moment={{ label: "Refunded", iso: refundProof.refundedAtIso }}
            />
          ) : null}
        </div>
      </section>

      <section className="section-shell mt-16">
        <div className="flex items-end justify-between gap-4">
          <div className="label-mono">Full directory</div>
          <Link
            href="/directory"
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--fg-muted)] hover:text-white"
          >
            Open directory →
          </Link>
        </div>
        <div className="mt-4 hazard-table">
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
                <div className="font-display text-lg font-extrabold tracking-tight text-white">
                  {bond.ticker}
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
                  {bond.status}
                </span>
              </div>
              <div className="font-mono text-xs text-[var(--fg-muted)]">
                {new Date(bond.expiresAtIso).toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-shell mt-16">
        <div className="hazard-card p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="label-mono text-[var(--yellow)]">Create a bond</div>
              <h2 className="mt-3 hazard-title--sm">From message to enforceable launch receipt.</h2>
              <p className="mt-5 max-w-2xl text-white/78 leading-relaxed">
                Paste a real Four.Meme launch, compile one explicit promise, and sign the bond. The official flow is parse-gated, the vault is verified, and the proof page is public by default.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickFeature label="Four.Meme parse required" value="No manual bypass" />
              <QuickFeature label="AI compile provider" value="DGrid in production" />
              <QuickFeature label="Proof surfaces" value="Bond, certificate, judge" />
              <QuickFeature label="Slash model" value="Permissionless" />
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/create" className="btn-hazard">
              Open create flow
            </Link>
            <Link href="/judge" className="btn-outline">
              Review evidence
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="label-mono">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono" : ""} text-white`}>{value}</div>
    </div>
  );
}

function CapabilityCard({
  icon,
  eyebrow,
  title,
  body,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="hazard-card p-6">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-[var(--yellow)]">
        {icon}
      </div>
      <div className="mt-5 label-mono">{eyebrow}</div>
      <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/72">{body}</p>
    </div>
  );
}

function SystemRow({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: "red" | "lime";
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/7 bg-white/[0.02] px-4 py-3">
      <span className="label-mono">{label}</span>
      <span className={`text-right text-sm ${mono ? "font-mono" : ""} ${accent === "red" ? "text-[var(--red)]" : accent === "lime" ? "text-[var(--lime)]" : "text-white/86"}`}>
        {value}
      </span>
    </div>
  );
}

function MiniProofCard({
  eyebrow,
  ticker,
  title,
  body,
  href,
  tone,
}: {
  eyebrow: string;
  ticker: string;
  title: string;
  body: string;
  href: string;
  tone: "red" | "lime";
}) {
  return (
    <Link href={href} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:border-white/14 hover:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <span className="label-mono">{eyebrow}</span>
        <span className={`status-badge ${tone === "red" ? "status-badge--slashed" : "status-badge--refunded"}`}>
          {ticker}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold tracking-[-0.02em] text-white">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-white/68">{body}</p>
    </Link>
  );
}

function QuickFeature({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.02] px-4 py-4">
      <div className="label-mono">{label}</div>
      <div className="mt-2 text-sm text-white/84">{value}</div>
    </div>
  );
}

function BondCard({
  bond,
  primaryTx,
  trail,
  moment,
}: {
  bond: ShowcaseBond;
  kind: "slash" | "refund";
  primaryTx: { label: string; href: string; hash: string };
  trail: Array<{ label: string; href: string; hash: string }>;
  moment: { label: string; iso: string };
}) {
  const variant = statusVariant(bond.status);
  const floor = Number(bond.declaredFloor);
  const proofBalance = Number(bond.currentBalance);
  const liveBalance = bond.liveCurrentBalance ? Number(bond.liveCurrentBalance) : null;
  const raw = floor > 0 ? (proofBalance / floor) * 100 : 0;
  const gaugePct = Math.max(0, Math.min(100, raw));
  const gaugeFill = variant === "refunded" ? "lime" : variant === "slashed" ? "red" : "yellow";
  const liveContextChanged =
    typeof liveBalance === "number" &&
    Number.isFinite(liveBalance) &&
    Math.abs(liveBalance - proofBalance) > 0.000001;

  return (
    <Link
      href={`/bond/${bond.id}${bond.bondTxHash ? `?bondTxHash=${bond.bondTxHash}` : ""}`}
      className={`hazard-card hazard-card--${variant} block p-6 md:p-7 group`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label-mono">{bond.tokenName}</div>
          <div className="mt-1 font-display text-4xl font-extrabold tracking-tight text-white">
            {bond.ticker}
          </div>
        </div>
        <span className={`status-badge status-badge--${variant}`}>
          <span className={`live-dot live-dot--${gaugeFill}`} />
          {bond.status}
        </span>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-6">
        <div>
          <div className="label-mono">Bond</div>
          <div className="giant giant--card mt-2 text-[var(--yellow)]">
            {Number(bond.bondAmountBnb).toFixed(3)}
            <span className="ml-1 text-lg text-white/50">BNB</span>
          </div>
        </div>
        <div>
          <div className="label-mono">Floor</div>
          <div className="giant giant--card mt-2 text-white">{formatNumber(bond.declaredFloor)}</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="label-mono">Balance at proof</span>
          <span className="font-mono text-xs text-white/80">{formatNumber(bond.currentBalance)}</span>
        </div>
        <div className="floor-gauge mt-2">
          <div className={`floor-gauge__fill floor-gauge__fill--${gaugeFill}`} style={{ width: `${gaugePct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          <span>0</span>
          <span>{gaugePct.toFixed(1)}% of floor</span>
        </div>
        {liveContextChanged ? (
          <div className="mt-3 rounded-2xl border border-white/7 bg-white/[0.02] px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="label-mono">Current live balance</span>
              <span className="font-mono text-xs text-white/80">{formatNumber(String(liveBalance))}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {trail.map((tx) => (
          <span key={tx.label} className="hash-pill">
            {tx.label} {tx.hash.slice(0, 6)}…{tx.hash.slice(-4)}
          </span>
        ))}
        <span className={`hash-pill hash-pill--${gaugeFill === "lime" ? "lime" : gaugeFill === "red" ? "red" : "yellow"}`}>
          {primaryTx.label} {primaryTx.hash.slice(0, 6)}…{primaryTx.hash.slice(-4)}
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <p className="text-sm leading-relaxed text-white/70 max-w-md">{bond.notes}</p>
        <div className="flex-shrink-0 text-right">
          <div className="label-mono">{moment.label}</div>
          <div className="mt-1 font-mono text-xs text-white/80">
            {new Date(moment.iso).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--yellow)] group-hover:text-white transition-colors">
          Open receipt
        </span>
        <ArrowUpRight className="h-4 w-4 text-[var(--yellow)] group-hover:text-white transition-colors" />
      </div>
    </Link>
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
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
