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
  const shareCardUrl = `/api/certificate/render?id=${encodeURIComponent(id)}`;
  const absoluteCertificateUrl = `${appUrl}/certificate/${encodeURIComponent(id)}`;
  const absoluteShareCardUrl = `${appUrl}${shareCardUrl}`;

  return (
    <section className="section-shell py-12">
      <div className="surface-strong overflow-hidden rounded-[1.5rem] p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="surface rounded-[1.25rem] p-5">
            <div className="review-kicker">Bonded launch certificate</div>
            <div className="mt-3 text-4xl font-semibold text-zinc-50">{bond.ticker}</div>
            <div className="mt-2 text-sm text-zinc-400">{bond.tokenName}</div>
            <div className="mt-6 overflow-hidden rounded-[1rem] border border-white/8 bg-[#0B1018]">
              <Image
                src={shareCardUrl}
                alt={`${bond.ticker} certificate share card`}
                width={1200}
                height={630}
                unoptimized
                className="h-auto w-full"
              />
            </div>
            <div className="mt-6 fact-strip cols-2">
              <FactCell label="Bond" value={`${bondAmountLabel} BNB`} />
              <FactCell label="Declared floor" value={bond.declaredFloor} />
              <FactCell label="Status" value={bond.status} />
              <FactCell label="Expiry" value={new Date(bond.expiresAtIso).toLocaleString()} />
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <div className="review-kicker">Public oath</div>
              <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-tight text-zinc-50 sm:text-5xl">
                I will hold at least {bond.declaredFloor} {bond.ticker} in my declared wallet for the duration of this bond.
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-400">
                This certificate does not prove every creator wallet on earth. It proves one public promise backed by real BNB and a public slash path.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="surface rounded-[1.25rem] p-5">
                <div className="review-kicker">Proof links</div>
                <p className="mt-3 text-sm leading-7 text-zinc-300">
                  Launch tx, bond tx, slash or refund tx, and the token page are all public.
                </p>
                {"bondTxHash" in bond && bond.bondTxHash ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a className="button-secondary rounded-full px-3 py-2 text-xs" href={bscScanTxUrl(bond.launchTxHash)} target="_blank" rel="noreferrer">Launch</a>
                    <a className="button-secondary rounded-full px-3 py-2 text-xs" href={bscScanTxUrl(bond.bondTxHash)} target="_blank" rel="noreferrer">Bond</a>
                    {"slashTxHash" in bond && bond.slashTxHash ? (
                      <a className="button-secondary rounded-full px-3 py-2 text-xs" href={bscScanTxUrl(bond.slashTxHash)} target="_blank" rel="noreferrer">Slash</a>
                    ) : null}
                    {"refundTxHash" in bond && bond.refundTxHash ? (
                      <a className="button-secondary rounded-full px-3 py-2 text-xs" href={bscScanTxUrl(bond.refundTxHash)} target="_blank" rel="noreferrer">Refund</a>
                    ) : null}
                    <a className="button-secondary rounded-full px-3 py-2 text-xs" href={fourMemeTokenUrl(bond.tokenAddress)} target="_blank" rel="noreferrer">Four.Meme</a>
                    <a className="button-secondary rounded-full px-3 py-2 text-xs" href={shareCardUrl} target="_blank" rel="noreferrer">Share card</a>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[1.25rem] border border-amber-500/20 bg-amber-500/10 p-5">
                <div className="review-kicker text-amber-200">Campaign mode</div>
                <div className="mt-3 text-sm leading-7 text-amber-100">Pay me if I rug.</div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <CopyButton
                    text={absoluteCertificateUrl}
                    label="Copy certificate link"
                    className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:border-amber-400/40 hover:bg-amber-500/15"
                  />
                  <CopyButton
                    text={absoluteShareCardUrl}
                    label="Copy share card URL"
                    className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:border-amber-400/40 hover:bg-amber-500/15"
                  />
                  <CopyButton
                    text={`Pay me if I rug. ${absoluteCertificateUrl}`}
                    label="Copy campaign line"
                    className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:border-amber-400/40 hover:bg-amber-500/15"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FactCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact-cell">
      <div className="fact-label">{label}</div>
      <div className="fact-value">{value}</div>
    </div>
  );
}
