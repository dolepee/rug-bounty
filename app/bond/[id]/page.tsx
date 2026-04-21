import Link from "next/link";
import { notFound } from "next/navigation";
import { getBondForPage } from "@/lib/data/showcase";
import { bscScanAddressUrl, bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";
import { BondActionPanel } from "@/app/bond/[id]/bond-action-panel";
import { BondTimePanel } from "@/app/bond/[id]/bond-time-panel";

export default async function BondDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bondTxHash?: string }>;
}) {
  const { id } = await params;
  const { bondTxHash } = await searchParams;
  const bond = await getBondForPage(id);
  if (!bond) notFound();

  const resolvedBondTxHash = bondTxHash || ("bondTxHash" in bond ? bond.bondTxHash : undefined);
  const bondAmountLabel = Number(bond.bondAmountBnb).toFixed(4);

  return (
    <section className="section-shell py-12">
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <div className="surface-strong rounded-[1.5rem] p-8 lg:p-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="review-kicker">Bond dossier</div>
                <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-zinc-50">{bond.ticker}</h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-300">{bond.notes}</p>
              </div>
              <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                bond.status === "SLASHED"
                  ? "bg-red-500/10 text-red-200"
                  : bond.status === "AT_RISK"
                    ? "bg-amber-500/10 text-amber-200"
                    : "bg-emerald-500/10 text-emerald-200"
              }`}>
                {bond.status}
              </div>
            </div>

            <div className="mt-8 fact-strip cols-4">
              <FactCell label="Bond size" value={`${bondAmountLabel} BNB`} />
              <FactCell label="Declared floor" value={bond.declaredFloor} />
              <FactCell label="Latest balance" value={bond.currentBalance} />
              <FactCell label="Creator" value={bond.creator} mono />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="surface rounded-[1.5rem] p-6">
              <div className="review-kicker">Proof model</div>
              <div className="mt-5 space-y-3">
                <InfoCell title="Vault-enforced" body="Slash, refund, expiry, grace window, floor, and declared creator wallets come from the contract." />
                <InfoCell title="App-verified" body="Four.Meme launch parsing and proof-page context are app-level verification, not onchain proof of launch provenance." />
                <InfoCell title="AI-assisted" body="Classification and rule compilation help narrow the promise. They do not decide slash or refund outcomes." />
              </div>
            </div>

            <div className="space-y-4">
              <div className="surface rounded-[1.5rem] p-6">
                <div className="review-kicker">Time window</div>
                <div className="mt-5">
                  <BondTimePanel expiresAtIso={bond.expiresAtIso} status={bond.status} />
                </div>
              </div>

              <div className="surface rounded-[1.5rem] p-6">
                <div className="review-kicker">State summary</div>
                <div className="mt-5 data-list">
                  <DataRow label="Status" value={bond.status} />
                  <DataRow label="Token" value={bond.tokenName} />
                  <DataRow label="Creator address" value={bond.creator} mono />
                  <DataRow label="Expiry" value={new Date(bond.expiresAtIso).toLocaleString()} />
                </div>
              </div>
            </div>
          </div>

          <div className="surface rounded-[1.5rem] p-6">
            <div className="review-kicker">Declared creator wallets</div>
            <div className="mt-5 grid gap-3">
              {bond.declaredCreatorWallets.map((wallet) => (
                <div key={wallet} className="flex flex-col gap-3 rounded-[1rem] border border-white/8 bg-white/[0.025] p-4 md:flex-row md:items-center md:justify-between">
                  <div className="font-mono text-sm text-zinc-200">{wallet}</div>
                  <a className="button-secondary rounded-full px-4 py-2 text-sm" href={bscScanAddressUrl(wallet)} target="_blank" rel="noreferrer">
                    View on BscScan
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="surface rounded-[1.5rem] p-6">
            <div className="review-kicker">Proof links</div>
            <div className="mt-5 flex flex-wrap gap-3">
              {resolvedBondTxHash ? (
                <a className="button-primary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(resolvedBondTxHash)} target="_blank" rel="noreferrer">
                  Bond tx
                </a>
              ) : null}
              <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(bond.launchTxHash)} target="_blank" rel="noreferrer">
                Launch tx
              </a>
              {"slashTxHash" in bond && bond.slashTxHash ? (
                <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(bond.slashTxHash)} target="_blank" rel="noreferrer">
                  Slash tx
                </a>
              ) : null}
              {"refundTxHash" in bond && bond.refundTxHash ? (
                <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(bond.refundTxHash)} target="_blank" rel="noreferrer">
                  Refund tx
                </a>
              ) : null}
              <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={fourMemeTokenUrl(bond.tokenAddress)} target="_blank" rel="noreferrer">
                Four.Meme page
              </a>
            </div>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28">
          <div className="surface rounded-[1.5rem] p-6">
            <div className="review-kicker">Reading note</div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              This page is not claiming full rug detection. It shows one public promise, the creator wallets behind it, and the onchain consequence attached to that promise.
            </p>
          </div>

          <BondActionPanel bondId={bond.id} creator={bond.creator} status={bond.status} expiresAtIso={bond.expiresAtIso} />

          <Link href={`/certificate/${bond.id}`} className="surface block rounded-[1.5rem] p-6 transition hover:border-[rgba(199,115,59,0.24)]">
            <div className="review-kicker">Certificate</div>
            <div className="mt-3 text-2xl font-semibold text-zinc-50">Open the Bonded Launch Certificate</div>
            <div className="mt-3 text-sm leading-7 text-zinc-400">
              Creator-facing share surface with proof links, launch context, and the bond summary.
            </div>
          </Link>
        </aside>
      </div>
    </section>
  );
}

function FactCell({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="fact-cell">
      <div className="fact-label">{label}</div>
      <div className={`fact-value ${mono ? "font-mono text-xs sm:text-sm break-all" : ""}`}>{value}</div>
    </div>
  );
}

function InfoCell({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1rem] border border-white/8 bg-white/[0.025] p-4">
      <div className="text-sm font-semibold text-zinc-100">{title}</div>
      <div className="mt-2 text-sm leading-7 text-zinc-400">{body}</div>
    </div>
  );
}

function DataRow({
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
      <div className={`data-row-value ${mono ? "font-mono text-xs sm:text-sm" : ""}`}>{value}</div>
    </div>
  );
}
