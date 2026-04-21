import Link from "next/link";
import { Scale } from "lucide-react";
import { bscScanAddressUrl, bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";
import { getCurrentMainnetProofs, refundProof, showcaseProof } from "@/lib/data/showcase";
import { getHunterRuntimeStatus } from "@/lib/data/hunter-status";
import { getConfiguredVaultAddress } from "@/lib/data/live-bonds";

export const dynamic = "force-dynamic";

const sourceRows = [
  { label: "Onchain enforced", value: "Floor, expiry, grace window, declared wallets, slash, and refund are enforced by the verified vault." },
  { label: "App verified", value: "The official create flow requires a successful real Four.Meme TokenCreate parse before it will build a bond." },
  { label: "Verified proof set", value: "The public transaction chains are curated real examples, not seeded screenshots or mock rows." },
  { label: "Runtime verified", value: "Watcher status comes from the VPS heartbeat path, not from showcase fallback data." },
];

const limitationRows = [
  "This does not detect every rug.",
  "This does not detect hidden undeclared wallets.",
  "The vault records launch metadata for display, but does not prove Four.Meme history onchain.",
  "Slash is permissionless. A third-party hunter can beat the watcher to the bounty.",
  "During the hackathon demo period, the 20% protocol leg routes to an author-controlled treasury.",
];

export default async function JudgeModePage() {
  const vaultAddress = getConfiguredVaultAddress();
  const hunterStatus = await getHunterRuntimeStatus();
  const proofs = await getCurrentMainnetProofs();
  const slashProofBond = proofs.find((bond) => bond.id === showcaseProof.bondId) ?? null;
  const refundBond = proofs.find((bond) => bond.id === refundProof.bondId) ?? null;
  const watchedBondIdsLabel = hunterStatus.watchedBondIds.length
    ? hunterStatus.watchedBondIds.join(", ")
    : hunterStatus.status === "online"
      ? "watcher online, no active bonds currently monitored"
      : "no active bonds currently monitored";

  return (
    <section className="section-shell py-12">
      <div className="surface-strong p-8 lg:p-10">
        <div className="status-chip inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.24em]">
          <Scale className="h-3.5 w-3.5 text-[var(--accent)]" />
          Judge packet
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="review-kicker">Executive summary</div>
            <h1 className="review-title mt-3 text-zinc-50">A Four.Meme trust primitive presented as an audit surface.</h1>
            <p className="review-subtitle mt-6">
              This page is the review packet. It shows the exact claim RugBounty makes, the proof chain already visible on mainnet, the live watcher context, and the limits of what the system does not claim to solve.
            </p>
            <div className="mt-7 rounded-[1rem] border border-white/8 bg-white/[0.025] p-5">
              <div className="data-row-label">Review in this order</div>
              <div className="mt-3 space-y-2 text-sm leading-7 text-zinc-300">
                <div>1. Verify the contract and source.</div>
                <div>2. Verify the slash and refund exhibits.</div>
                <div>3. Verify runtime heartbeat and watcher status.</div>
                <div>4. Read the limitations and decide whether the claim is scoped honestly.</div>
              </div>
            </div>
          </div>

          <aside className="dossier-panel">
            <div className="review-kicker">Packet metadata</div>
            <div className="mt-5 dossier-list">
              <DossierRow label="Verified vault" value={vaultAddress ?? "not configured"} mono />
              <DossierRow label="Runtime" value={`${hunterStatus.runtime.toUpperCase()} · ${hunterStatus.status.toUpperCase()}`} />
              <DossierRow label="Last heartbeat" value={hunterStatus.lastTickIso ? new Date(hunterStatus.lastTickIso).toLocaleString() : "unknown"} />
              <DossierRow label="Watched bonds" value={watchedBondIdsLabel} />
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-12 section-heading">
        <div>
          <div className="review-kicker">Mainnet exhibits</div>
          <h2 className="mt-2 text-4xl font-semibold text-zinc-50">The failure path and success path are both already public.</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {slashProofBond ? (
          <ExhibitPanel
            exhibit="Exhibit A / slashed bond"
            title={`${slashProofBond.ticker} breached the declared floor.`}
            description="The creator broke the retained-balance promise. The watcher flagged the breach, and a third-party hunter captured the permissionless slash."
            status="SLASHED"
            tone="danger"
            metrics={[
              { label: "Original bond", value: `${slashProofBond.bondAmountBnb} BNB` },
              { label: "Declared floor", value: slashProofBond.declaredFloor },
              { label: "Latest observed balance", value: slashProofBond.currentBalance },
            ]}
            links={[
              { label: "Launch tx", href: bscScanTxUrl(showcaseProof.launchTxHash), primary: true },
              { label: "Bond tx", href: bscScanTxUrl(showcaseProof.bondTxHash) },
              { label: "Breach flag", href: bscScanTxUrl(showcaseProof.breachFlagTxHash) },
              { label: "Slash tx", href: bscScanTxUrl(showcaseProof.slashTxHash) },
              { label: "Four.Meme", href: fourMemeTokenUrl(slashProofBond.tokenAddress) },
            ]}
          />
        ) : null}

        {refundBond ? (
          <ExhibitPanel
            exhibit="Exhibit B / refunded bond"
            title={`${refundBond.ticker} held through expiry and grace.`}
            description="The creator preserved the declared floor until the refund path opened, then reclaimed the bond onchain."
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
            ]}
          />
        ) : null}
      </div>

      <div className="mt-12 grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="surface p-6">
          <div className="review-kicker">Evidence register</div>
          <div className="mt-5 space-y-4">
            {sourceRows.map((row) => (
              <LongformRow key={row.label} label={row.label} body={row.value} />
            ))}
          </div>
        </div>

        <div className="surface p-6">
          <div className="review-kicker">Why AI is in the loop</div>
          <div className="mt-5 space-y-4">
            <LongformRow
              label="Compression"
              body="AI compresses vague creator messaging into one machine-checkable oath instead of leaving traders to interpret launch hype manually."
            />
            <LongformRow
              label="Segmentation"
              body="It separates enforceable balance-floor promises from social-only statements so the vault only bonds the sentence it can actually judge."
            />
            <LongformRow
              label="Boundary"
              body="AI does not decide slash or refund. It narrows the claim; the contract and watcher still govern the evidence path."
            />
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="surface p-6">
          <div className="review-kicker">Not claimed</div>
          <div className="mt-5 space-y-3">
            {limitationRows.map((item) => (
              <div key={item} className="rounded-[0.9rem] border border-white/8 bg-white/[0.025] p-4 text-sm leading-7 text-zinc-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-6">
          <div className="review-kicker">Direct inspection</div>
          <div className="mt-5 data-list">
            <DataRow label="Contract" value="Read the verified vault and confirm slash/refund semantics." />
            <DataRow label="Official flow" value="Confirm the create flow requires real Four.Meme parse evidence before it can build the payload." />
            <DataRow label="Proof quality" value="Follow the launch, bond, breach/refund, and certificate links to the public proof surfaces." />
            <DataRow label="Runtime" value="Check heartbeat and watched-bond output. The watcher is deliberately exposed as operational context." />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {vaultAddress ? (
              <>
                <a href={bscScanAddressUrl(vaultAddress)} target="_blank" rel="noreferrer" className="button-primary rounded-lg px-4 py-2.5 text-sm">
                  Open contract
                </a>
                <a href={`${bscScanAddressUrl(vaultAddress)}#code`} target="_blank" rel="noreferrer" className="button-secondary rounded-lg px-4 py-2.5 text-sm">
                  View source
                </a>
              </>
            ) : null}
            <Link href="/create" className="button-secondary rounded-lg px-4 py-2.5 text-sm">
              Open bond flow
            </Link>
          </div>
        </div>
      </div>
    </section>
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

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="data-row">
      <div className="data-row-label">{label}</div>
      <div className="data-row-value">{value}</div>
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

function ExhibitPanel({
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
  links: Array<{ label: string; href: string; primary?: boolean }>;
}) {
  return (
    <div className="surface p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="review-kicker">{exhibit}</div>
          <h2 className="mt-3 text-3xl font-semibold text-zinc-50">{title}</h2>
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
        {links.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className={`${link.primary ? "button-primary" : "button-secondary"} rounded-lg px-4 py-2.5 text-sm`}>
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
