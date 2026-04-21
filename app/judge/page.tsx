import Link from "next/link";
import { Bot, FileSearch, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { bscScanAddressUrl, bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";
import { getCurrentMainnetProofs, refundProof, showcaseProof } from "@/lib/data/showcase";
import { getHunterRuntimeStatus } from "@/lib/data/hunter-status";
import { getConfiguredVaultAddress } from "@/lib/data/live-bonds";

export const dynamic = "force-dynamic";

const proofModel = [
  {
    label: "Vault-enforced",
    body: "Declared creator wallets, retained floor, bond amount, expiry, slash window, and refund window are enforced onchain.",
  },
  {
    label: "App-verified",
    body: "The app parses real Four.Meme TokenCreate launches before allowing the official bond flow.",
  },
  {
    label: "AI-assisted",
    body: "AI classifies promises and compiles enforceable rules. It does not decide slash or refund.",
  },
];

const disclosures = [
  "This does not detect every rug.",
  "This does not detect hidden undeclared wallets.",
  "The vault records launch metadata for display, but does not verify Four.Meme history onchain.",
  "Slash is permissionless. The agent is a live hunter, not a privileged oracle, and another hunter can beat it to the bounty.",
  "During the hackathon demo period, the 20% protocol leg routes to an author-controlled treasury. Production deployments should point it at a burn, DAO, or multisig.",
];

export default async function JudgeModePage() {
  const vaultAddress = getConfiguredVaultAddress();
  const proofs = await getCurrentMainnetProofs();
  const slashProofBond = proofs.find((bond) => bond.id === showcaseProof.bondId) ?? null;
  const refundProofBond = proofs.find((bond) => bond.id === refundProof.bondId) ?? null;
  const hunterStatus = await getHunterRuntimeStatus();
  const watchedBondIdsLabel = hunterStatus.watchedBondIds.length
    ? hunterStatus.watchedBondIds.join(", ")
    : hunterStatus.status === "online"
      ? "watcher online, no active bonds currently monitored"
      : "no active bonds currently monitored";

  return (
    <section className="section-shell py-12">
      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="surface-strong rounded-[2rem] p-8">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 status-chip font-mono text-xs uppercase tracking-[0.24em]">
            <Scale className="h-3.5 w-3.5 text-[var(--accent)]" />
            Judge packet
          </div>
          <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold tracking-tight text-zinc-50">
            A trust primitive for Four.Meme, reduced to proof.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-300">
            This page compresses the evaluation surface into one place: the verified vault, final proof set, live watcher heartbeat, sourcing boundaries, and the exact claims RugBounty is making.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <ForensicCard icon={ShieldCheck} title="Verified vault" body="The contract on BscScan is the authority for slash and refund state." />
            <ForensicCard icon={Bot} title="Live watcher" body="Hunter runtime comes from the actual VPS heartbeat, not a seeded UI row." />
            <ForensicCard icon={FileSearch} title="Scoped claim" body="Narrow enough to audit: one creator-wallet floor, one bond, one consequence." />
          </div>
        </div>

        <div className="surface rounded-[2rem] p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Current runtime packet</div>
          <div className="mt-4 grid gap-3">
            <RuntimeRow label="Verified vault" value={vaultAddress ?? "not configured"} mono />
            <RuntimeRow label="Runtime" value={hunterStatus.runtime.toUpperCase()} />
            <RuntimeRow label="Status" value={hunterStatus.status.toUpperCase()} tone={hunterStatus.status === "online" ? "success" : "warning"} />
            <RuntimeRow
              label="Last heartbeat"
              value={hunterStatus.lastTickIso ? new Date(hunterStatus.lastTickIso).toLocaleString() : "unknown"}
            />
            <RuntimeRow label="Watched bond ids" value={watchedBondIdsLabel} mono />
            <RuntimeRow label="Watcher identity" value="public hunter not disclosed in status snapshot" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {vaultAddress ? (
              <>
                <a className="button-primary rounded-full px-4 py-2.5 text-sm" href={bscScanAddressUrl(vaultAddress)} target="_blank" rel="noreferrer">
                  Open contract
                </a>
                <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={`${bscScanAddressUrl(vaultAddress)}#code`} target="_blank" rel="noreferrer">
                  View verified source
                </a>
              </>
            ) : null}
            <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href="/api/hunter/status" target="_blank" rel="noreferrer">
              Raw hunter status
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 xl:grid-cols-2">
        {slashProofBond ? (
          <ProofPanel
            eyebrow="Outcome A / slash path"
            title={`${slashProofBond.ticker} proved the public failure case.`}
            description="The creator broke the declared retained-balance floor, our watcher flagged the breach onchain, and a third-party hunter won the permissionless slash race."
            status="SLASHED"
            statusTone="danger"
            metrics={[
              { label: "Token", value: slashProofBond.tokenName },
              { label: "Bond", value: `${slashProofBond.bondAmountBnb} BNB` },
              { label: "Floor", value: slashProofBond.declaredFloor },
              { label: "Outcome", value: "creator breached floor, public hunter slashed" },
            ]}
            actions={[
              { label: "Launch", href: bscScanTxUrl(showcaseProof.launchTxHash), primary: true },
              { label: "Bond", href: bscScanTxUrl(showcaseProof.bondTxHash) },
              { label: "Breach flag", href: bscScanTxUrl(showcaseProof.breachFlagTxHash) },
              { label: "Slash", href: bscScanTxUrl(showcaseProof.slashTxHash) },
              { label: "Four.Meme", href: fourMemeTokenUrl(slashProofBond.tokenAddress) },
              { label: "Bond page", href: `/bond/${slashProofBond.id}?bondTxHash=${showcaseProof.bondTxHash}`, internal: true },
            ]}
          />
        ) : null}

        {refundProofBond ? (
          <ProofPanel
            eyebrow="Outcome B / refund path"
            title={`${refundProofBond.ticker} proved the clean success case.`}
            description="The creator held the retained-balance floor through expiry plus the grace window, then reclaimed the bond cleanly onchain."
            status="REFUNDED"
            statusTone="success"
            metrics={[
              { label: "Token", value: refundProofBond.tokenName },
              { label: "Bond", value: `${refundProofBond.bondAmountBnb} BNB` },
              { label: "Floor", value: refundProofBond.declaredFloor },
              { label: "Outcome", value: "creator held floor, refunded after grace" },
            ]}
            actions={[
              { label: "Launch", href: bscScanTxUrl(refundProof.launchTxHash), primary: true },
              { label: "Bond", href: bscScanTxUrl(refundProof.bondTxHash) },
              { label: "Refund", href: bscScanTxUrl(refundProof.refundTxHash) },
              { label: "Four.Meme", href: fourMemeTokenUrl(refundProofBond.tokenAddress) },
              { label: "Bond page", href: `/bond/${refundProofBond.id}?bondTxHash=${refundProof.bondTxHash}`, internal: true },
            ]}
          />
        ) : null}
      </div>

      <div className="mt-10 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface rounded-[2rem] p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Proof sourcing</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SourceCard title="Onchain enforced" body="Slash, refund, declared wallets, floor, and expiry come from the verified vault." />
            <SourceCard title="Verified proof set" body="The FSLH and FRFD tx chains are curated mainnet proof links for the public narrative." />
            <SourceCard title="App verified" body="The app parses real Four.Meme TokenCreate launches before allowing the official bond flow." />
            <SourceCard title="Runtime status" body="Watcher status comes from the VPS heartbeat or actual feed, not seeded showcase rows." />
          </div>
        </div>

        <div className="surface rounded-[2rem] p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Why AI belongs here</div>
          <div className="mt-5 grid gap-3">
            <InfoPanel body="AI compresses vague creator messaging into one machine-checkable oath instead of leaving traders to interpret hype by hand." />
            <InfoPanel body="It separates enforceable balance-floor promises from social-only claims, so the vault bonds only the sentence the contract can actually judge." />
            <InfoPanel body="That makes launch trust legible in minutes: creators get a cleaner oath, traders get a narrower claim, and the vault gets a rule it can enforce." />
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="surface rounded-[2rem] p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Proof model</div>
          <div className="mt-5 grid gap-4">
            {proofModel.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold text-zinc-100">{item.label}</div>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface rounded-[2rem] p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Not claimed</div>
          <div className="mt-5 space-y-3 text-sm text-zinc-300">
            {disclosures.map((item) => (
              <div key={item} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/create" className="button-primary rounded-full px-5 py-3 text-sm">
          Open bond flow
        </Link>
        <Link href="/directory" className="button-secondary rounded-full px-5 py-3 text-sm">
          Browse directory
        </Link>
      </div>
    </section>
  );
}

function ForensicCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
      <Icon className="h-5 w-5 text-[var(--accent)]" />
      <div className="mt-3 text-base font-semibold text-zinc-50">{title}</div>
      <div className="mt-2 text-sm leading-7 text-zinc-400">{body}</div>
    </div>
  );
}

function RuntimeRow({
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

function ProofPanel({
  eyebrow,
  title,
  description,
  status,
  statusTone,
  metrics,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  statusTone: "success" | "danger";
  metrics: Array<{ label: string; value: string }>;
  actions: Array<{ label: string; href: string; primary?: boolean; internal?: boolean }>;
}) {
  return (
    <div className="surface rounded-[2rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">{eyebrow}</div>
          <h2 className="mt-2 font-display text-3xl font-semibold text-zinc-50">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">{description}</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
          statusTone === "danger" ? "bg-red-500/10 text-red-200" : "bg-emerald-500/10 text-emerald-200"
        }`}>
          {status}
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{metric.label}</div>
            <div className="mt-2 text-sm text-zinc-100">{metric.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {actions.map((action) =>
          action.internal ? (
            <Link key={action.label} href={action.href} className={`${action.primary ? "button-primary" : "button-secondary"} rounded-full px-4 py-2.5 text-sm`}>
              {action.label}
            </Link>
          ) : (
            <a
              key={action.label}
              className={`${action.primary ? "button-primary" : "button-secondary"} rounded-full px-4 py-2.5 text-sm`}
              href={action.href}
              target="_blank"
              rel="noreferrer"
            >
              {action.label}
            </a>
          ),
        )}
      </div>
    </div>
  );
}

function SourceCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-300">
      <div className="font-semibold text-zinc-100">{title}</div>
      <div className="mt-2">{body}</div>
    </div>
  );
}

function InfoPanel({ body }: { body: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-300">
      {body}
    </div>
  );
}
