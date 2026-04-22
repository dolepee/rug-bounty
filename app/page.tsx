import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Bot, ShieldCheck, Sparkles } from "lucide-react";
import { getLegacyArchiveBonds, legacyProofVaultAddress } from "@/lib/data/showcase";
import { getHunterRuntimeStatus } from "@/lib/data/hunter-status";
import { getLiveVaultBonds, type LiveBondRecord } from "@/lib/data/live-bonds";

export const dynamic = "force-dynamic";

type StatusVariant = "slashed" | "refunded" | "active";

export default async function HomePage() {
  const [activeVaultBonds, legacyArchiveBonds, hunterStatus] = await Promise.all([
    getLiveVaultBonds(),
    getLegacyArchiveBonds(),
    getHunterRuntimeStatus(),
  ]);

  const latestActiveBond = activeVaultBonds[0] ?? null;

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
              Current vault live / {hunterLine}
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
                <HeroStat label="Current vault" value={hunterStatus.vaultAddress ? shortenAddress(hunterStatus.vaultAddress) : "unconfigured"} mono />
                <HeroStat label="Active bonds" value={String(activeVaultBonds.length)} />
                <HeroStat label="Watcher" value={hunterStatus.status.toUpperCase()} />
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
                <SystemRow label="Funded flow" value="Current vault only" />
                <SystemRow label="Watcher runtime" value={hunterStatus.lastTickIso ? new Date(hunterStatus.lastTickIso).toLocaleString() : "heartbeat unavailable"} />
                <SystemRow label="Latest event" value={hunterStatus.lastEventLabel ?? "no runtime action recorded yet"} />
                <SystemRow
                  label="Latest active bond"
                  value={
                    latestActiveBond
                      ? `${latestActiveBond.ticker} / ${latestActiveBond.status}`
                      : "no current-vault bond published yet"
                  }
                />
                <SystemRow label="Legacy archive" value={`${legacyArchiveBonds.length} historical receipts`} />
                <SystemRow label="Archive vault" value={shortenAddress(legacyProofVaultAddress)} mono />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <MiniBriefCard
                  eyebrow="Current vault"
                  title="Fresh funded tests land here first."
                  body="Create, judge, and runtime all point at the active burn-address vault. New bonds should appear under Proofs without replacing the archive."
                  href="/create"
                />
                <MiniBriefCard
                  eyebrow="Legacy archive"
                  title="Earlier receipts stay inspectable."
                  body="The previous public vault remains available as history. It supports credibility, but it is no longer the active funded flow."
                  href="/directory"
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
            <div className="label-mono">Current vault receipts</div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              Live receipts update automatically.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
              The active burn-address vault is the official funded system. When a new bond is created, refunded, or slashed on the current vault, it belongs in this section without rewriting the site narrative.
            </p>
          </div>
          <Link
            href="/directory"
            className="hidden items-center gap-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--fg-muted)] hover:text-white sm:inline-flex"
          >
            Open proofs <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activeVaultBonds.length ? (
          <div className="mt-6 hazard-table">
            <div className="hazard-table__head">
              <div>Token</div>
              <div>Bond</div>
              <div>Floor</div>
              <div>Status</div>
              <div>Expiry</div>
            </div>
            {activeVaultBonds.map((bond) => (
              <ActiveBondRow key={bond.id} bond={bond} />
            ))}
          </div>
        ) : (
          <div className="mt-6 hazard-card p-6 md:p-8">
            <div className="label-mono">No current-vault proof published yet</div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72">
              The active vault is configured and the watcher is online, but there is no public receipt on the current funded path yet. Use the create flow for fresh tests; the earlier vault remains available as archive only.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/create" className="btn-hazard">
                Open create flow
              </Link>
              <Link href="/directory" className="btn-outline">
                Inspect legacy archive
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="section-shell mt-16">
        <div className="hazard-card p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="label-mono">Legacy archive</div>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                Legacy receipts stay available.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/72">
                The previous public vault already proved slash and refund outcomes onchain. That archive remains public for inspection, but it is no longer the active funded path.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/directory" className="btn-outline">
                Open archive
              </Link>
              <Link href="/judge" className="btn-outline">
                Review evidence
              </Link>
            </div>
          </div>
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

function MiniBriefCard({
  eyebrow,
  title,
  body,
  href,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:border-white/14 hover:bg-white/[0.03]">
      <span className="label-mono">{eyebrow}</span>
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

function ActiveBondRow({ bond }: { bond: LiveBondRecord }) {
  return (
    <Link
      href={`/bond/${bond.id}`}
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
        {Number(bond.originalBondAmountBnb ?? bond.bondAmountBnb).toFixed(4)} <span className="text-[var(--fg-muted)]">BNB</span>
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
