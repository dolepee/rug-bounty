import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { bscScanAddressUrl, bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";
import { getCurrentMainnetProofs, refundProof, showcaseProof } from "@/lib/data/showcase";
import { getHunterRuntimeStatus } from "@/lib/data/hunter-status";
import { getConfiguredVaultAddress } from "@/lib/data/live-bonds";

export const dynamic = "force-dynamic";

const evidenceRows = [
  { label: "Onchain enforced", body: "Floor, expiry, grace window, declared wallets, slash, and refund are enforced by the verified vault." },
  { label: "App verified", body: "The official create flow requires a successful real Four.Meme TokenCreate parse before it will build a bond." },
  { label: "Verified proof set", body: "The public transaction chains are curated real examples, not seeded screenshots or mock rows." },
  { label: "Runtime verified", body: "Watcher status comes from the VPS heartbeat path, not from showcase fallback data." },
];

const aiRows = [
  { label: "Compression", body: "AI compresses vague creator messaging into one machine-checkable oath instead of leaving traders to interpret launch hype manually." },
  { label: "Segmentation", body: "It separates enforceable balance-floor promises from social-only statements so the vault only bonds the sentence it can actually judge." },
  { label: "Boundary", body: "AI does not decide slash or refund. It narrows the claim; the contract and watcher govern the evidence path." },
];

const limits = [
  "This does not detect every rug.",
  "This does not detect hidden undeclared wallets.",
  "The vault records launch metadata for display, but does not prove Four.Meme history onchain.",
  "Slash is permissionless. A third-party hunter can beat the watcher to the bounty.",
  "During the hackathon demo, the 20% protocol leg routes to an author-controlled treasury.",
];

export default async function JudgeModePage() {
  const vaultAddress = getConfiguredVaultAddress();
  const hunterStatus = await getHunterRuntimeStatus();
  const proofs = await getCurrentMainnetProofs();
  const slashProofBond = proofs.find((bond) => bond.id === showcaseProof.bondId) ?? null;
  const refundBond = proofs.find((bond) => bond.id === refundProof.bondId) ?? null;
  const watchedLabel = hunterStatus.watchedBondIds.length
    ? hunterStatus.watchedBondIds.join(", ")
    : hunterStatus.status === "online"
      ? "watcher online, no active bonds currently monitored"
      : "no active bonds currently monitored";
  const runtimeDot = hunterStatus.status === "online" ? "lime" : hunterStatus.status === "stale" ? "yellow" : "muted";

  return (
    <div>
      <section>
        <div className="warning-stripes warning-stripes--thin" />
        <div className="section-shell py-12 md:py-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="label-mono">Judge packet</div>
              <h1 className="mt-3 hazard-title--sm">Claim. Proof. Limits.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
                This page is the review packet. It shows the exact claim, the mainnet proof chain, the live watcher context, and what the system does not claim to solve.
              </p>
            </div>
            <div className="hazard-card p-5 lg:w-[380px]">
              <div className="label-mono">Packet metadata</div>
              <div className="mt-4 space-y-3">
                <Meta label="Vault" value={vaultAddress ? `${vaultAddress.slice(0, 8)}…${vaultAddress.slice(-6)}` : "not configured"} mono />
                <Meta
                  label="Runtime"
                  value={`${hunterStatus.runtime.toUpperCase()} / ${hunterStatus.status.toUpperCase()}`}
                  dot={runtimeDot}
                />
                <Meta
                  label="Last heartbeat"
                  value={hunterStatus.lastTickIso ? new Date(hunterStatus.lastTickIso).toLocaleString() : "unknown"}
                />
                <Meta label="Watched bonds" value={watchedLabel} />
              </div>
            </div>
          </div>

          <div className="mt-8 hazard-card p-5">
            <div className="label-mono">Review in this order</div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <Step index="01" body="Verify the contract and source." />
              <Step index="02" body="Verify the slash and refund exhibits." />
              <Step index="03" body="Verify runtime heartbeat status." />
              <Step index="04" body="Read the limitations, decide honest scope." />
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="label-mono">Mainnet exhibits</div>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Failure path and success path are both already public.
        </h2>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {slashProofBond ? (
            <ExhibitCard
              exhibit="Exhibit A / slashed bond"
              title={`${slashProofBond.ticker} breached the declared floor.`}
              description="The creator broke the retained-balance promise. Watcher flagged, third-party hunter captured the permissionless slash."
              status="SLASHED"
              tone="slashed"
              metrics={[
                { label: "Bond", value: `${slashProofBond.bondAmountBnb} BNB` },
                { label: "Floor", value: slashProofBond.declaredFloor },
                { label: "Last balance", value: slashProofBond.currentBalance },
              ]}
              links={[
                { label: "Launch", href: bscScanTxUrl(showcaseProof.launchTxHash), tone: "muted" },
                { label: "Bond", href: bscScanTxUrl(showcaseProof.bondTxHash), tone: "yellow" },
                { label: "Flag", href: bscScanTxUrl(showcaseProof.breachFlagTxHash), tone: "red" },
                { label: "Slash", href: bscScanTxUrl(showcaseProof.slashTxHash), tone: "red" },
                { label: "Four.Meme", href: fourMemeTokenUrl(slashProofBond.tokenAddress), tone: "muted" },
              ]}
            />
          ) : null}

          {refundBond ? (
            <ExhibitCard
              exhibit="Exhibit B / refunded bond"
              title={`${refundBond.ticker} held through expiry and grace.`}
              description="The creator preserved the declared floor until the refund path opened, then reclaimed the bond onchain."
              status="REFUNDED"
              tone="refunded"
              metrics={[
                { label: "Bond", value: `${refundBond.bondAmountBnb} BNB` },
                { label: "Floor", value: refundBond.declaredFloor },
                { label: "Last balance", value: refundBond.currentBalance },
              ]}
              links={[
                { label: "Launch", href: bscScanTxUrl(refundProof.launchTxHash), tone: "muted" },
                { label: "Bond", href: bscScanTxUrl(refundProof.bondTxHash), tone: "yellow" },
                { label: "Refund", href: bscScanTxUrl(refundProof.refundTxHash), tone: "lime" },
                { label: "Four.Meme", href: fourMemeTokenUrl(refundBond.tokenAddress), tone: "muted" },
              ]}
            />
          ) : null}
        </div>
      </section>

      <section className="section-shell mt-12">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="hazard-card p-6">
            <div className="label-mono">Evidence register</div>
            <div className="mt-4 space-y-4">
              {evidenceRows.map((row) => (
                <LongRow key={row.label} label={row.label} body={row.body} />
              ))}
            </div>
          </div>
          <div className="hazard-card p-6">
            <div className="label-mono">Why AI is in the loop</div>
            <div className="mt-4 space-y-4">
              {aiRows.map((row) => (
                <LongRow key={row.label} label={row.label} body={row.body} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell mt-12">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hazard-card p-6">
            <div className="flex items-center gap-2">
              <span className="live-dot live-dot--yellow" />
              <span className="label-mono text-[var(--yellow)]">Not claimed</span>
            </div>
            <div className="mt-4 space-y-2">
              {limits.map((item) => (
                <div
                  key={item}
                  className="rounded border border-[var(--border)] bg-white/[0.015] px-4 py-3 text-xs leading-relaxed text-white/80"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="hazard-card p-6">
            <div className="label-mono">Direct inspection</div>
            <div className="mt-4 space-y-3">
              <InspectRow label="Contract" body="Read the verified vault and confirm slash/refund semantics." />
              <InspectRow label="Create flow" body="Confirm it requires real Four.Meme parse evidence before signing." />
              <InspectRow label="Proof pages" body="Follow launch, bond, breach/refund, and certificate links." />
              <InspectRow label="Runtime" body="Check heartbeat and watched-bond output on the hero card." />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {vaultAddress ? (
                <>
                  <a
                    href={bscScanAddressUrl(vaultAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-hazard"
                  >
                    Open contract <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={`${bscScanAddressUrl(vaultAddress)}#code`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline"
                  >
                    View source <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </>
              ) : null}
              <Link href="/create" className="btn-outline">
                Open bond flow <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-14 warning-stripes warning-stripes--thin" />
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
  dot,
}: {
  label: string;
  value: string;
  mono?: boolean;
  dot?: "lime" | "yellow" | "red" | "muted";
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="label-mono">{label}</span>
      <span className={`flex items-center gap-2 text-right text-xs ${mono ? "font-mono" : ""} text-white/90`}>
        {dot ? <span className={`live-dot live-dot--${dot}`} /> : null}
        <span className="break-all">{value}</span>
      </span>
    </div>
  );
}

function Step({ index, body }: { index: string; body: string }) {
  return (
    <div className="rounded border border-[var(--border)] bg-white/[0.015] p-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--yellow)]">{index}</div>
      <div className="mt-1 text-xs leading-relaxed text-white/85">{body}</div>
    </div>
  );
}

function LongRow({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="label-mono">{label}</div>
      <p className="mt-2 text-sm leading-relaxed text-white/80">{body}</p>
    </div>
  );
}

function InspectRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="live-dot live-dot--muted mt-1.5 flex-shrink-0" />
      <div>
        <div className="label-mono">{label}</div>
        <p className="mt-1 text-xs leading-relaxed text-white/75">{body}</p>
      </div>
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
  tone: "slashed" | "refunded";
  metrics: Array<{ label: string; value: string }>;
  links: Array<{ label: string; href: string; tone: "muted" | "yellow" | "red" | "lime" }>;
}) {
  return (
    <div className={`hazard-card hazard-card--${tone} p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label-mono">{exhibit}</div>
          <h3 className="mt-2 font-display text-xl font-extrabold tracking-tight text-white md:text-2xl">
            {title}
          </h3>
        </div>
        <span className={`status-badge status-badge--${tone}`}>
          <span className={`live-dot live-dot--${tone === "slashed" ? "red" : "lime"}`} />
          {status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/75">{description}</p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded border border-[var(--border)] bg-white/[0.015] p-3">
            <div className="label-mono">{m.label}</div>
            <div className="mt-1 break-all font-mono text-xs text-white/90">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-[var(--border)] bg-white/[0.015] px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-white/85 hover:border-[var(--yellow)] hover:bg-[var(--yellow-soft)] transition-colors"
          >
            <span className={`live-dot live-dot--${link.tone}`} />
            {link.label}
            <ArrowUpRight className="h-3 w-3" />
          </a>
        ))}
      </div>
    </div>
  );
}
