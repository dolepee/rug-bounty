import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getCurrentMainnetProofs, getDirectoryBonds, refundProof, showcaseProof } from "@/lib/data/showcase";
import { getHunterRuntimeStatus } from "@/lib/data/hunter-status";
import { bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";

export const dynamic = "force-dynamic";

const narrativeRows = [
  {
    label: "For creators",
    body: "A launch can carry one machine-checkable promise instead of a wall of vague reassurance. The bond becomes a public credibility instrument.",
  },
  {
    label: "For traders",
    body: "The app compresses launch noise into one narrow claim: who made the promise, what floor was declared, and what happens if it breaks.",
  },
  {
    label: "For Four.Meme",
    body: "Launch speed is already solved. Trust legibility is not. RugBounty adds a public consequence layer without pretending to solve every rug pattern.",
  },
];

const scopeRows = [
  { label: "Vault-enforced", value: "Declared floor, expiry, grace window, slash, refund, and declared creator wallets come from the verified contract." },
  { label: "App-verified", value: "The official create flow requires a successful real Four.Meme TokenCreate parse before it will build a bond." },
  { label: "AI role", value: "AI narrows launch messaging into one enforceable sentence. The vault still decides whether the bond survives." },
];

export default async function HomePage() {
  const currentProofs = await getCurrentMainnetProofs();
  const bonds = await getDirectoryBonds();
  const hunterStatus = await getHunterRuntimeStatus();
  const slashProof = currentProofs.find((bond) => bond.id === showcaseProof.bondId) ?? null;
  const refundBond = currentProofs.find((bond) => bond.id === refundProof.bondId) ?? null;
  const watchedBondIdsLabel = hunterStatus.watchedBondIds.length
    ? hunterStatus.watchedBondIds.join(", ")
    : hunterStatus.status === "online"
      ? "watcher online, no active bonds currently monitored"
      : "no active bonds currently monitored";

  return (
    <div className="pb-24">
      <section className="hero-glow">
        <div className="section-shell py-12">
          <div className="surface-strong p-8 lg:p-10">
            <div className="status-chip inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.24em]">
              Evidence-led launch trust for Four.Meme
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="review-kicker">Opening claim</div>
                <h1 className="review-title mt-3 max-w-4xl text-zinc-50">A creator promise converted into public evidence.</h1>
                <p className="review-subtitle mt-6">
                  RugBounty lets a creator stake real money behind one explicit promise about their own bag. If the declared floor breaks, the bond becomes bounty. If the creator survives expiry and grace, the bond is returned.
                </p>
                <p className="mt-5 max-w-3xl text-sm leading-8 text-zinc-400">
                  The product is intentionally narrow. It does not claim broad rug detection. It creates one auditable trust object: a launch promise, a verified vault rule, and a public consequence path.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/judge" className="button-primary rounded-lg px-5 py-3 text-sm">
                    Open Judge Packet
                  </Link>
                  <Link href="/create" className="button-secondary rounded-lg px-5 py-3 text-sm">
                    Review Bond Flow
                  </Link>
                  <Link href="/directory" className="button-secondary rounded-lg px-5 py-3 text-sm">
                    Inspect Proof Set
                  </Link>
                </div>
              </div>

              <aside className="dossier-panel">
                <div className="review-kicker">Case summary</div>
                <div className="mt-5 dossier-list">
                  <DossierRow label="Verified vault" value={hunterStatus.vaultAddress ?? "unknown"} mono />
                  <DossierRow label="Proof loops" value={`${currentProofs.length} mainnet outcomes`} />
                  <DossierRow label="Watcher runtime" value={`${hunterStatus.runtime.toUpperCase()} · ${hunterStatus.status.toUpperCase()}`} />
                  <DossierRow label="Last heartbeat" value={hunterStatus.lastTickIso ? new Date(hunterStatus.lastTickIso).toLocaleString() : "unknown"} />
                  <DossierRow label="Watched bonds" value={watchedBondIdsLabel} />
                </div>
              </aside>
            </div>

            <div className="section-rule mt-8" />
            <div className="mt-6 grid gap-3 lg:grid-cols-3">
              {scopeRows.map((row) => (
                <NarrativeCell key={row.label} label={row.label} body={row.value} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {(slashProof || refundBond) ? (
        <section className="section-shell mt-14">
          <div className="section-heading">
            <div>
              <div className="review-kicker">Verified proof set</div>
              <h2 className="mt-2 text-4xl font-semibold text-zinc-50">Two exhibits: one slash, one refund.</h2>
            </div>
            <div className="soft-note text-sm leading-7">
              The examples are intentionally small. They were cycled on BNB mainnet to prove the failure and success paths without staging fake outcomes.
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {slashProof ? (
              <ExhibitCard
                exhibit="Exhibit A / failure path"
                title={`${slashProof.ticker} breached the declared floor.`}
                description="The creator fell below the retained balance. The watcher flagged the breach onchain, then an external hunter won the permissionless slash race."
                status="SLASHED"
                tone="danger"
                metrics={[
                  { label: "Original bond", value: `${slashProof.bondAmountBnb} BNB` },
                  { label: "Declared floor", value: slashProof.declaredFloor },
                  { label: "Latest observed balance", value: slashProof.currentBalance },
                ]}
                links={[
                  { label: "Launch tx", href: bscScanTxUrl(showcaseProof.launchTxHash), primary: true },
                  { label: "Bond tx", href: bscScanTxUrl(showcaseProof.bondTxHash) },
                  { label: "Breach flag", href: bscScanTxUrl(showcaseProof.breachFlagTxHash) },
                  { label: "Slash tx", href: bscScanTxUrl(showcaseProof.slashTxHash) },
                  { label: "Four.Meme", href: fourMemeTokenUrl(slashProof.tokenAddress) },
                  { label: "Proof page", href: `/bond/${slashProof.id}?bondTxHash=${showcaseProof.bondTxHash}`, internal: true },
                ]}
              />
            ) : null}

            {refundBond ? (
              <ExhibitCard
                exhibit="Exhibit B / success path"
                title={`${refundBond.ticker} survived and reclaimed the bond.`}
                description="The creator held the declared floor through expiry and the hunter grace window, then executed the refund path onchain."
                status="REFUNDED"
                tone="success"
                metrics={[
                  { label: "Original bond", value: `${refundBond.bondAmountBnb} BNB` },
                  { label: "Declared floor", value: refundBond.declaredFloor },
                  { label: "Latest observed balance", value: refundBond.currentBalance },
                ]}
                links={[
                  { label: "Launch tx", href: bscScanTxUrl(refundProof.launchTxHash), primary: true },
                  { label: "Bond tx", href: bscScanTxUrl(refundProof.bondTxHash) },
                  { label: "Refund tx", href: bscScanTxUrl(refundProof.refundTxHash) },
                  { label: "Four.Meme", href: fourMemeTokenUrl(refundBond.tokenAddress) },
                  { label: "Proof page", href: `/bond/${refundBond.id}?bondTxHash=${refundProof.bondTxHash}`, internal: true },
                ]}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="section-shell mt-14">
        <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="surface p-6">
            <div className="review-kicker">Why this exists</div>
            <div className="mt-5 space-y-4">
              {narrativeRows.map((row) => (
                <LongformRow key={row.label} label={row.label} body={row.body} />
              ))}
            </div>
          </div>

          <div className="surface p-6">
            <div className="review-kicker">Reading guide</div>
            <div className="mt-5 data-list">
              <DataRow label="Core claim" value="One explicit creator-wallet promise with a public onchain consequence." />
              <DataRow label="Why it is native" value="The official flow is gated to real Four.Meme launch evidence, not generic ERC20 payload stuffing." />
              <DataRow label="Why it is credible" value="Verified vault, public watcher heartbeat, and both slash/refund outcomes already exist on mainnet." />
              <DataRow label="What it is not" value="Not broad rug scoring. Not hidden-wallet discovery. Not AI decoration." />
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell mt-14">
        <div className="section-heading">
          <div>
            <div className="review-kicker">Proof directory</div>
            <h2 className="mt-2 text-4xl font-semibold text-zinc-50">The full record can be scanned in one pass.</h2>
          </div>
          <Link href="/directory" className="inline-flex items-center gap-2 text-sm text-[var(--accent-soft)] hover:text-white">
            Open full directory <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1rem] border border-white/8 bg-[rgba(16,20,26,0.94)]">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1.2fr_0.7fr_0.85fr_0.8fr_1fr] gap-4 px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                <div>Token</div>
                <div>Bond</div>
                <div>Declared floor</div>
                <div>Status</div>
                <div>Review window</div>
              </div>
              {bonds.map((bond) => (
                <Link
                  key={bond.id}
                  href={`/bond/${bond.id}${bond.bondTxHash ? `?bondTxHash=${bond.bondTxHash}` : ""}`}
                  className="table-row grid grid-cols-[1.2fr_0.7fr_0.85fr_0.8fr_1fr] gap-4 px-5 py-4 text-sm"
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
          </div>
        </div>
      </section>
    </div>
  );
}

function DossierRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="data-row">
      <div className="data-row-label">{label}</div>
      <div className={`data-row-value ${mono ? "font-mono text-xs sm:text-sm break-all" : ""}`}>{value}</div>
    </div>
  );
}

function NarrativeCell({ label, body }: { label: string; body: string }) {
  return (
    <div className="fact-cell">
      <div className="fact-label">{label}</div>
      <div className="fact-value">{body}</div>
    </div>
  );
}

function LongformRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="longform-row">
      <div className="data-row-label">{label}</div>
      <div className="mt-2 text-sm leading-8 text-zinc-300">{body}</div>
    </div>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="data-row">
      <div className="data-row-label">{label}</div>
      <div className="data-row-value">{value}</div>
    </div>
  );
}

function ExhibitCard({
  exhibit,
  title,
  description,
  status,
  tone,
  metrics,
  links,
}: {
  exhibit: string;
  title: string;
  description: string;
  status: string;
  tone: "success" | "danger";
  metrics: Array<{ label: string; value: string }>;
  links: Array<{ label: string; href: string; primary?: boolean; internal?: boolean }>;
}) {
  return (
    <div className="surface p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="review-kicker">{exhibit}</div>
          <h3 className="mt-3 text-3xl font-semibold text-zinc-50">{title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">{description}</p>
        </div>
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone === "danger" ? "bg-red-500/10 text-red-200" : "bg-emerald-500/10 text-emerald-200"}`}>
          {status}
        </div>
      </div>

      <div className="mt-6 fact-strip cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="fact-cell">
            <div className="fact-label">{metric.label}</div>
            <div className="fact-value">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {links.map((link) =>
          link.internal ? (
            <Link key={link.label} href={link.href} className={`${link.primary ? "button-primary" : "button-secondary"} rounded-lg px-4 py-2.5 text-sm`}>
              {link.label}
            </Link>
          ) : (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className={`${link.primary ? "button-primary" : "button-secondary"} rounded-lg px-4 py-2.5 text-sm`}>
              {link.label}
            </a>
          ),
        )}
      </div>
    </div>
  );
}
