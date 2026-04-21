import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Radar,
  ReceiptText,
  ScrollText,
  SearchCheck,
  ShieldAlert,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { getCurrentMainnetProofs, getDirectoryBonds, refundProof, showcaseProof } from "@/lib/data/showcase";
import { getHunterRuntimeStatus } from "@/lib/data/hunter-status";
import { bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";

export const dynamic = "force-dynamic";

const proofModel = [
  { label: "Vault-enforced", detail: "slash, refund, expiry, floor, and declared wallets come from the contract" },
  { label: "App-verified", detail: "only real Four.Meme TokenCreate launches can enter the official bond flow" },
  { label: "AI-assisted", detail: "AI narrows creator promises into one rule the vault can actually judge" },
];

const productSignals = [
  {
    icon: SearchCheck,
    title: "Trust primitive, not vague analytics",
    body: "RugBounty enforces one public promise with money attached instead of pretending to score every rug scenario.",
  },
  {
    icon: Bot,
    title: "Autonomous runtime",
    body: "The watcher runs on a VPS under PM2, flags breaches onchain, and keeps a public heartbeat without exposing the hunter wallet.",
  },
  {
    icon: WalletCards,
    title: "Creator-side conversion asset",
    body: "A bond is not just punishment insurance. It becomes a proof page, certificate, and launch-time credibility surface.",
  },
  {
    icon: ScrollText,
    title: "Native to Four.Meme timing",
    body: "Launch speed is already solved on Four.Meme. Trust, legibility, and accountability are the missing layer.",
  },
];

export default async function HomePage() {
  const currentProofs = await getCurrentMainnetProofs();
  const bonds = await getDirectoryBonds();
  const showcase = currentProofs.find((bond) => bond.id === showcaseProof.bondId) ?? null;
  const refundBond = currentProofs.find((bond) => bond.id === refundProof.bondId) ?? null;
  const hunterStatus = await getHunterRuntimeStatus();
  const watchedBondIdsLabel = hunterStatus.watchedBondIds.length
    ? hunterStatus.watchedBondIds.join(", ")
    : hunterStatus.status === "online"
      ? "watcher online, no active bonds currently monitored"
      : "no active bonds currently monitored";

  return (
    <div className="pb-24">
      <section className="hero-glow">
        <div className="section-shell pt-10 pb-8">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="surface-strong rounded-[2rem] p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 status-chip font-mono text-xs uppercase tracking-[0.24em]">
                <ShieldAlert className="h-3.5 w-3.5 text-[var(--accent)]" />
                Bonded Launches For Four.Meme
              </div>
              <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[0.95] tracking-tight text-zinc-50 sm:text-6xl xl:text-7xl">
                Launches that carry their own consequence.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
                RugBounty is a trust primitive for meme launches. Creators lock BNB behind one narrow promise about their own bag. If the declared floor breaks, the bond becomes public bounty.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {proofModel.map((item) => (
                  <div key={item.label} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{item.label}</div>
                    <div className="mt-2 text-sm leading-6 text-zinc-300">{item.detail}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/create" className="button-primary rounded-full px-5 py-3 text-sm">
                  Bond Your Launch
                </Link>
                <Link href="/judge" className="button-secondary rounded-full px-5 py-3 text-sm">
                  Open Judge Mode
                </Link>
                <Link href="/directory" className="button-secondary rounded-full px-5 py-3 text-sm">
                  Browse Proof Set
                </Link>
              </div>
              <div className="mt-8 rounded-[1.6rem] border border-[rgba(255,138,61,0.16)] bg-[rgba(255,138,61,0.08)] p-4 text-sm leading-7 text-[var(--accent-soft)]">
                Not a rug detector. Not a vague reputation score. One explicit launch promise with an onchain penalty.
              </div>
            </div>

            <div className="grid gap-4">
              <div className="surface rounded-[2rem] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Final vault packet</div>
                    <div className="mt-3 font-display text-3xl font-semibold text-zinc-100">Verified mainnet proof, one screen away.</div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    hunterStatus.status === "online"
                      ? "bg-emerald-500/10 text-emerald-200"
                      : hunterStatus.status === "stale"
                        ? "bg-amber-500/10 text-amber-200"
                        : "bg-white/8 text-zinc-300"
                  }`}>
                    {hunterStatus.status.toUpperCase()}
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Proof loops</div>
                    <div className="mt-2 text-4xl font-semibold text-zinc-50">{currentProofs.length}</div>
                    <div className="mt-2 text-sm text-zinc-400">Final vault outcomes proven on BNB mainnet</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Watched vault</div>
                    <div className="mt-2 break-all font-mono text-sm text-zinc-200">{hunterStatus.vaultAddress ?? "unknown"}</div>
                    <div className="mt-2 text-sm text-zinc-400">Runtime heartbeat from the live VPS watcher</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Last heartbeat</div>
                    <div className="mt-2 text-lg font-semibold text-zinc-50">
                      {hunterStatus.lastTickIso ? new Date(hunterStatus.lastTickIso).toLocaleString() : "unknown"}
                    </div>
                    <div className="mt-2 text-sm text-zinc-400">{watchedBondIdsLabel}</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Rule</div>
                    <div className="mt-2 text-lg font-semibold text-zinc-50">CREATOR_WALLET_FLOOR</div>
                    <div className="mt-2 text-sm text-zinc-400">Narrow enough to prove, strong enough to matter</div>
                  </div>
                </div>
              </div>

              <div className="surface rounded-[2rem] p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">What judges need fast</div>
                    <div className="mt-2 text-xl font-semibold text-zinc-100">Two real outcomes, one public runtime, one verified vault.</div>
                  </div>
                  <Link href="/judge" className="inline-flex items-center gap-2 text-sm text-[var(--accent-soft)] hover:text-white">
                    Open packet <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-6 grid gap-3">
                  <div className="flex items-start gap-3 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                    <ReceiptText className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
                    <div>
                      <div className="text-sm font-semibold text-zinc-100">Launch parse is part of the product</div>
                      <div className="mt-1 text-sm leading-6 text-zinc-400">The official create flow now requires a successful real Four.Meme TokenCreate parse before it will build a bond.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                    <Radar className="mt-0.5 h-5 w-5 text-[var(--signal)]" />
                    <div>
                      <div className="text-sm font-semibold text-zinc-100">Permissionless slash is the point</div>
                      <div className="mt-1 text-sm leading-6 text-zinc-400">Our agent flags breaches, but anyone can win the slash. The final `FSLH` proof shows a third-party hunter taking the bounty.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showcase || refundBond ? (
        <section className="section-shell mt-4">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Verified proof set</div>
              <h2 className="mt-2 font-display text-4xl font-semibold text-zinc-50">The primitive is proven in both directions.</h2>
            </div>
            <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
              Demo bonds are small because the loops were cycled repeatedly on mainnet under budget.
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {showcase ? (
              <div className="surface rounded-[2rem] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Outcome A / failure path</div>
                    <h3 className="mt-2 font-display text-3xl font-semibold text-zinc-50">{showcase.ticker} breached the floor and lost the bond.</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                      A creator launched on Four.Meme, bonded a public floor, broke it, our agent flagged the breach, and a public hunter won the permissionless slash race.
                    </p>
                  </div>
                  <div className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
                    SLASHED
                  </div>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <MetricCard label="Bond" value={`${showcase.bondAmountBnb} BNB`} tone="danger" />
                  <MetricCard label="Declared floor" value={showcase.declaredFloor} />
                  <MetricCard label="Current balance" value={showcase.currentBalance} />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a className="button-primary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(showcaseProof.launchTxHash)} target="_blank" rel="noreferrer">Launch tx</a>
                  <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(showcaseProof.bondTxHash)} target="_blank" rel="noreferrer">Bond tx</a>
                  <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(showcaseProof.breachFlagTxHash)} target="_blank" rel="noreferrer">Breach flag</a>
                  <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(showcaseProof.slashTxHash)} target="_blank" rel="noreferrer">Slash</a>
                  <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={fourMemeTokenUrl(showcase.tokenAddress)} target="_blank" rel="noreferrer">Four.Meme</a>
                  <Link href={`/bond/${showcase.id}?bondTxHash=${showcaseProof.bondTxHash}`} className="button-secondary rounded-full px-4 py-2.5 text-sm">
                    Proof page
                  </Link>
                </div>
              </div>
            ) : null}

            {refundBond ? (
              <div className="surface rounded-[2rem] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Outcome B / success path</div>
                    <h3 className="mt-2 font-display text-3xl font-semibold text-zinc-50">{refundBond.ticker} held the floor and reclaimed the bond.</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                      The creator kept the declared retained-balance floor intact through expiry and the hunter grace window, then claimed the refund cleanly onchain.
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    REFUNDED
                  </div>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <MetricCard label="Bond" value={`${refundBond.bondAmountBnb} BNB`} tone="success" />
                  <MetricCard label="Declared floor" value={refundBond.declaredFloor} />
                  <MetricCard label="Current balance" value={refundBond.currentBalance} />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a className="button-primary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(refundProof.launchTxHash)} target="_blank" rel="noreferrer">Launch tx</a>
                  <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(refundProof.bondTxHash)} target="_blank" rel="noreferrer">Bond tx</a>
                  <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(refundProof.refundTxHash)} target="_blank" rel="noreferrer">Refund</a>
                  <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={fourMemeTokenUrl(refundBond.tokenAddress)} target="_blank" rel="noreferrer">Four.Meme</a>
                  <Link href={`/bond/${refundBond.id}?bondTxHash=${refundProof.bondTxHash}`} className="button-secondary rounded-full px-4 py-2.5 text-sm">
                    Bond page
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="section-shell mt-14">
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="surface rounded-[2rem] p-6">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-zinc-200">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              Why this product reads differently
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {productSignals.map((item) => (
                <div key={item.title} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                  <item.icon className="h-5 w-5 text-[var(--accent)]" />
                  <div className="mt-3 text-base font-semibold text-zinc-50">{item.title}</div>
                  <div className="mt-2 text-sm leading-7 text-zinc-400">{item.body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface rounded-[2rem] p-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Runtime snapshot</div>
            <h2 className="mt-3 font-display text-3xl font-semibold text-zinc-50">A live watcher, not a decorative bot.</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              The public runtime status is wired to the actual VPS heartbeat. The hunter wallet stays private, but the system tells you when it last ran and which vault it is watching.
            </p>
            <div className="mt-6 grid gap-3">
              <RuntimeCard label="Runtime" value={hunterStatus.runtime.toUpperCase()} />
              <RuntimeCard label="Status" value={hunterStatus.status.toUpperCase()} tone={hunterStatus.status === "online" ? "success" : hunterStatus.status === "stale" ? "warning" : "neutral"} />
              <RuntimeCard label="Watched vault" value={hunterStatus.vaultAddress ?? "unknown"} mono />
              <RuntimeCard label="Last heartbeat" value={hunterStatus.lastTickIso ? new Date(hunterStatus.lastTickIso).toLocaleString() : "unknown"} />
              <RuntimeCard label="Watched bond ids" value={watchedBondIdsLabel} mono />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href="/api/hunter/status" target="_blank" rel="noreferrer">
                Raw hunter status
              </a>
              {hunterStatus.lastResolvedTxHash ? (
                <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(hunterStatus.lastResolvedTxHash)} target="_blank" rel="noreferrer">
                  Latest public slash tx
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell mt-14">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Verified proof directory</div>
            <h2 className="mt-2 font-display text-4xl font-semibold text-zinc-50">Real launches. Real bonds. Real outcomes.</h2>
          </div>
          <Link href="/directory" className="inline-flex items-center gap-2 text-sm text-[var(--accent-soft)] hover:text-white">
            Open full directory <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-[rgba(10,16,28,0.92)]">
          <div className="grid grid-cols-[1.2fr_0.75fr_0.75fr_0.75fr_0.9fr] gap-4 px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
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
              className="table-row grid grid-cols-[1.2fr_0.75fr_0.75fr_0.75fr_0.9fr] gap-4 px-5 py-4 text-sm"
            >
              <div>
                <div className="font-semibold text-zinc-100">{bond.ticker}</div>
                <div className="mt-1 text-zinc-500">{bond.tokenName}</div>
              </div>
              <div>{Number(bond.bondAmountBnb).toFixed(4)} BNB</div>
              <div>{bond.declaredFloor}</div>
              <div className={bond.status === "SLASHED" ? "metric-danger" : bond.status === "REFUNDED" ? "metric-positive" : "metric-warning"}>
                {bond.status}
              </div>
              <div className="text-zinc-400">{new Date(bond.expiresAtIso).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-shell mt-14">
        <div className="grid gap-4 lg:grid-cols-4">
          <SummaryCard label="Verified proof loops" value={String(currentProofs.length)} />
          <SummaryCard label="Verified slashes" value={String(currentProofs.filter((bond) => bond.status === "SLASHED").length)} tone="danger" />
          <SummaryCard label="Verified refunds" value={String(currentProofs.filter((bond) => bond.status === "REFUNDED").length)} tone="success" />
          <SummaryCard label="Primary rule" value="CREATOR_WALLET_FLOOR" tone="signal" compact />
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass =
    tone === "success" ? "text-emerald-200" : tone === "danger" ? "text-red-200" : "text-zinc-100";
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function RuntimeCard({
  label,
  value,
  mono = false,
  tone = "neutral",
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass =
    tone === "success" ? "text-emerald-200" : tone === "warning" ? "text-amber-200" : "text-zinc-100";
  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</div>
      <div className={`mt-2 break-all text-sm ${mono ? "font-mono" : ""} ${toneClass}`}>{value}</div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
  compact = false,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger" | "signal";
  compact?: boolean;
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-200"
      : tone === "danger"
        ? "text-red-200"
        : tone === "signal"
          ? "text-sky-200"
          : "text-zinc-50";
  return (
    <div className="surface rounded-[1.7rem] p-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</div>
      <div className={`mt-3 ${compact ? "break-words text-lg" : "text-4xl"} font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}
