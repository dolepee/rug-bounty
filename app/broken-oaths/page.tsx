import { ArrowUpRight } from "lucide-react";
import { getBrokenOathBonds, showcaseProof } from "@/lib/data/showcase";
import { bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";

export const dynamic = "force-dynamic";

export default async function BrokenOathsPage() {
  const broken = await getBrokenOathBonds();

  return (
    <div>
      <section>
        <div className="warning-stripes warning-stripes--thin" />
        <div className="section-shell py-12 md:py-16">
          <div className="flex items-center gap-2">
            <span className="live-dot live-dot--red" />
            <span className="label-mono text-[var(--red)]">Wall of broken oaths</span>
          </div>
          <h1 className="mt-4 hazard-title--sm">Every slashed bond.<br/>Public consequence.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
            The trust mechanism is the onchain slash. This wall exists to make broken launch promises legible, public, and easy to inspect.
          </p>
        </div>
      </section>

      <section className="section-shell">
        <div className="grid gap-4 lg:grid-cols-2">
          {broken.map((bond) => {
            const isShowcase = bond.id === showcaseProof.bondId;
            return (
              <div key={bond.id} className="hazard-card hazard-card--slashed p-6 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="label-mono">{bond.tokenName}</div>
                    <div className="mt-1 font-display text-4xl font-extrabold tracking-tight text-white">
                      {bond.ticker}
                    </div>
                    {isShowcase ? (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded border border-[rgba(255,46,46,0.35)] bg-[rgba(255,46,46,0.08)] px-2 py-1">
                        <span className="live-dot live-dot--red" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--red)]">
                          Final BNB mainnet slash proof
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <span className="status-badge status-badge--slashed">
                    <span className="live-dot live-dot--red" />
                    SLASHED
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <Metric label="Floor" value={formatNumber(bond.declaredFloor)} />
                  <Metric label="Last balance" value={formatNumber(bond.currentBalance)} />
                  <Metric label="Bond" value={`${Number(bond.bondAmountBnb).toFixed(4)} BNB`} />
                </div>

                <p className="mt-5 text-sm leading-relaxed text-white/75">
                  {isShowcase
                    ? `${bond.ticker} broke its oath on BNB mainnet. The creator launched on Four.Meme, bonded a 1.05M floor, then sold below it. The watcher flagged the breach and a public hunter won the slash race.`
                    : `${bond.ticker} broke its oath. Declared creator wallets fell below the public floor before expiry, and the first hunter to call the vault took the bond.`}
                </p>

                {isShowcase ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <ProofPill href={bscScanTxUrl(showcaseProof.launchTxHash)} label="Launch" tone="muted" />
                    <ProofPill href={bscScanTxUrl(showcaseProof.bondTxHash)} label="Bond" tone="yellow" />
                    <ProofPill href={bscScanTxUrl(showcaseProof.breachFlagTxHash)} label="Flag" tone="red" />
                    <ProofPill href={bscScanTxUrl(showcaseProof.slashTxHash)} label="Slash" tone="red" />
                    <ProofPill href={fourMemeTokenUrl(bond.tokenAddress)} label="Four.Meme" tone="muted" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Info body="A slashed row means the creator fell below the declared floor before refund eligibility." />
          <Info body="Slash is permissionless. The first valid hunter to execute takes 80% of the bond." />
          <Info body="These rows are proof surfaces, not universal rug detection or reputation scoring." />
        </div>
      </section>

      <div className="mt-14 warning-stripes warning-stripes--thin" />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--border)] bg-white/[0.015] p-3">
      <div className="label-mono">{label}</div>
      <div className="mt-1 font-mono text-sm text-white/90 break-all">{value}</div>
    </div>
  );
}

function ProofPill({
  href,
  label,
  tone,
}: {
  href: string;
  label: string;
  tone: "muted" | "yellow" | "red";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded border border-[var(--border)] bg-white/[0.015] px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-white/85 hover:border-[var(--yellow)] hover:bg-[var(--yellow-soft)] transition-colors"
    >
      <span className={`live-dot live-dot--${tone}`} />
      {label}
      <ArrowUpRight className="h-3 w-3" />
    </a>
  );
}

function Info({ body }: { body: string }) {
  return (
    <div className="hazard-card p-5">
      <div className="flex items-start gap-2">
        <span className="live-dot live-dot--muted mt-1.5" />
        <p className="text-xs leading-relaxed text-white/75">{body}</p>
      </div>
    </div>
  );
}

function formatNumber(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
