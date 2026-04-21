import Image from "next/image";
import { notFound } from "next/navigation";
import { getBondForPage } from "@/lib/data/showcase";
import { bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";
import { CopyButton } from "@/app/components/copy-button";

const cleanEnv = (value?: string | null) => value?.trim() || undefined;
const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || "https://rug-bounty.vercel.app";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bond = await getBondForPage(id);
  if (!bond) notFound();

  const bondAmountLabel = Number(bond.bondAmountBnb).toFixed(4);
  const variant = statusVariant(bond.status);
  const gaugeFill = variant === "refunded" ? "lime" : variant === "slashed" ? "red" : "yellow";
  const floor = Number(bond.declaredFloor);
  const balance = Number(bond.currentBalance);
  const raw = floor > 0 ? (balance / floor) * 100 : 0;
  const gaugePct = Math.max(0, Math.min(100, raw));
  const shareCardUrl = `/api/certificate/render?id=${encodeURIComponent(id)}`;
  const absoluteCertificateUrl = `${appUrl}/certificate/${encodeURIComponent(id)}`;
  const absoluteShareCardUrl = `${appUrl}${shareCardUrl}`;

  return (
    <section className="section-shell py-12">
      <div className={`hazard-card overflow-hidden ${variant === "slashed" ? "hazard-card--slashed" : variant === "refunded" ? "hazard-card--refunded" : "hazard-card--active"}`}>
        <div className="warning-stripes warning-stripes--thin" />
        <div className="p-6 md:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="label-mono">Bonded launch certificate</div>
                  <div className="mt-3 text-sm text-white/60">{bond.tokenName}</div>
                  <h1 className="hazard-title mt-3" style={{ color: "#ffffff", fontSize: "clamp(3.1rem, 8vw, 5.6rem)" }}>
                    {bond.ticker}
                  </h1>
                </div>
                <span className={`status-badge status-badge--${variant}`}>
                  <span className={`live-dot live-dot--${gaugeFill}`} />
                  {bond.status}
                </span>
              </div>

              <div className="overflow-hidden rounded border border-[var(--border)] bg-black">
                <div className="warning-stripes warning-stripes--thin" />
                <div className="bg-[#070707] p-3">
                  <Image
                    src={shareCardUrl}
                    alt={`${bond.ticker} certificate share card`}
                    width={1200}
                    height={630}
                    unoptimized
                    className="h-auto w-full rounded border border-[var(--border)]"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile label="Bond staked" value={`${bondAmountLabel} BNB`} accent="yellow" />
                <MetricTile label="Expires" value={new Date(bond.expiresAtIso).toLocaleString()} />
                <MetricTile label="Declared floor" value={bond.declaredFloor} />
                <MetricTile label="Current balance" value={bond.currentBalance} />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <div className="label-mono">Public oath</div>
                <div className="giant giant--hero mt-3 text-[var(--yellow)]">
                  {bondAmountLabel}
                  <span className="ml-2 text-2xl text-white/45">BNB</span>
                </div>
                <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/80">
                  I will hold at least {bond.declaredFloor} {bond.ticker} in my declared wallet for the duration of this bond.
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                  This receipt proves one public promise, the bonded floor attached to it, and the public outcome trail on BNB mainnet.
                </p>
              </div>

              <div className="rounded border border-[var(--border)] bg-white/[0.015] p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="label-mono">Floor coverage</span>
                  <span className="font-mono text-xs text-white/80">{gaugePct.toFixed(1)}%</span>
                </div>
                <div className="floor-gauge mt-3">
                  <div className={`floor-gauge__fill floor-gauge__fill--${gaugeFill}`} style={{ width: `${gaugePct}%` }} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetricTile label="Declared floor" value={`${formatTokenAmount(bond.declaredFloor)} tokens`} compact />
                  <MetricTile label="Latest balance" value={formatTokenAmount(bond.currentBalance)} compact />
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded border border-[var(--border)] bg-white/[0.015] p-5">
                  <div className="label-mono">Receipt trail</div>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">
                    Every step of the bond is public: launch, bond creation, and the final slash or refund outcome.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <ReceiptPill label="Launch" href={bscScanTxUrl(bond.launchTxHash)} value={shortHash(bond.launchTxHash)} kind="muted" />
                    {"bondTxHash" in bond && bond.bondTxHash ? (
                      <ReceiptPill label="Bond" href={bscScanTxUrl(bond.bondTxHash)} value={shortHash(bond.bondTxHash)} kind="yellow" />
                    ) : null}
                    {"slashTxHash" in bond && bond.slashTxHash ? (
                      <ReceiptPill label="Slash" href={bscScanTxUrl(bond.slashTxHash)} value={shortHash(bond.slashTxHash)} kind="red" />
                    ) : null}
                    {"refundTxHash" in bond && bond.refundTxHash ? (
                      <ReceiptPill label="Refund" href={bscScanTxUrl(bond.refundTxHash)} value={shortHash(bond.refundTxHash)} kind="lime" />
                    ) : null}
                    <ReceiptPill label="Four.Meme" href={fourMemeTokenUrl(bond.tokenAddress)} value={bond.ticker} kind="muted" />
                    <ReceiptPill label="Share card" href={shareCardUrl} value="Render" kind="muted" />
                  </div>
                </div>

                <div className="rounded border border-[var(--yellow-border)] bg-[var(--yellow-soft)] p-5">
                  <div className="label-mono" style={{ color: "var(--yellow)" }}>Campaign mode</div>
                  <div className="mt-3 hazard-title--sm" style={{ color: "#ffffff", fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}>
                    Pay me if I rug.
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-white/75">
                    Share the receipt, the rendered card, or the direct certificate link. This is the creator-facing trust artifact.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <CopyButton
                      text={absoluteCertificateUrl}
                      label="Copy certificate link"
                      className="btn-outline text-[11px]"
                    />
                    <CopyButton
                      text={absoluteShareCardUrl}
                      label="Copy share card URL"
                      className="btn-outline text-[11px]"
                    />
                    <CopyButton
                      text={`Pay me if I rug. ${absoluteCertificateUrl}`}
                      label="Copy campaign line"
                      className="btn-outline text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="warning-stripes warning-stripes--thin" />
      </div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  accent,
  compact = false,
}: {
  label: string;
  value: string;
  accent?: "yellow";
  compact?: boolean;
}) {
  return (
    <div className="rounded border border-[var(--border)] bg-white/[0.015] p-4">
      <div className="label-mono">{label}</div>
      <div className={`mt-2 ${compact ? "text-sm" : "text-base"} ${accent === "yellow" ? "text-[var(--yellow)]" : "text-white/88"} ${compact ? "font-mono" : "font-semibold tracking-[-0.02em]"}`}>
        {value}
      </div>
    </div>
  );
}

function ReceiptPill({
  label,
  href,
  value,
  kind,
}: {
  label: string;
  href: string;
  value: string;
  kind: "muted" | "yellow" | "red" | "lime";
}) {
  const dotKind = kind === "muted" ? "muted" : kind;
  const tone =
    kind === "yellow" ? "hash-pill--yellow" : kind === "red" ? "hash-pill--red" : kind === "lime" ? "hash-pill--lime" : "";

  return (
    <a href={href} target="_blank" rel="noreferrer" className={`hash-pill ${tone}`}>
      <span className={`live-dot live-dot--${dotKind}`} />
      <span>{label}</span>
      <span className="text-white/70">{value}</span>
    </a>
  );
}

function statusVariant(status: string): "slashed" | "refunded" | "active" {
  if (status === "SLASHED") return "slashed";
  if (status === "REFUNDED") return "refunded";
  return "active";
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

function formatTokenAmount(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(3)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
