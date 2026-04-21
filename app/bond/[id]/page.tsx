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
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="surface-strong rounded-[2rem] p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Bond dossier</div>
                <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-zinc-50">{bond.ticker}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">{bond.notes}</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                bond.status === "SLASHED"
                  ? "bg-red-500/10 text-red-200"
                  : bond.status === "AT_RISK"
                    ? "bg-amber-500/10 text-amber-200"
                    : "bg-emerald-500/10 text-emerald-200"
              }`}>
                {bond.status}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <BondMetric label="Bond size" value={`${bondAmountLabel} BNB`} />
              <BondMetric label="Declared floor" value={bond.declaredFloor} />
              <BondMetric label="Current balance" value={bond.currentBalance} />
              <BondMetric label="Creator" value={bond.creator} mono />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_0.92fr]">
            <div className="surface rounded-[2rem] p-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Proof model</div>
              <div className="mt-5 grid gap-4">
                <DossierCard title="Vault-enforced" body="Current-state floor slash and refund logic from declared wallets only." />
                <DossierCard title="App-verified" body="Four.Meme launch tx parsing and launch metadata display." />
                <DossierCard title="AI-assisted" body="Promise classification, rule compilation, and outcome narration." />
              </div>
            </div>

            <div className="space-y-4">
              <div className="surface rounded-[2rem] p-6">
                <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">State window</div>
                <div className="mt-5">
                  <BondTimePanel expiresAtIso={bond.expiresAtIso} status={bond.status} />
                </div>
              </div>

              <div className="surface rounded-[2rem] p-6">
                <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">State summary</div>
                <div className="mt-5 grid gap-3 text-sm">
                  <StateRow label="Status" value={bond.status} />
                  <StateRow label="Token" value={bond.tokenName} />
                  <StateRow label="Creator address" value={bond.creator} mono />
                  <StateRow label="Expiry" value={new Date(bond.expiresAtIso).toLocaleString()} />
                </div>
              </div>
            </div>
          </div>

          <div className="surface rounded-[2rem] p-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Declared creator wallets</div>
            <div className="mt-5 grid gap-3">
              {bond.declaredCreatorWallets.map((wallet) => (
                <div key={wallet} className="flex flex-col gap-3 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
                  <div className="font-mono text-sm text-zinc-200">{wallet}</div>
                  <a className="button-secondary rounded-full px-4 py-2 text-sm" href={bscScanAddressUrl(wallet)} target="_blank" rel="noreferrer">
                    View on BscScan
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="surface rounded-[2rem] p-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Proof links</div>
            <div className="mt-5 flex flex-wrap gap-3">
              {resolvedBondTxHash ? (
                <a className="button-primary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(resolvedBondTxHash)} target="_blank" rel="noreferrer">
                  BondCreated tx
                </a>
              ) : null}
              <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(bond.launchTxHash)} target="_blank" rel="noreferrer">
                Four.Meme launch tx
              </a>
              {"slashTxHash" in bond && bond.slashTxHash ? (
                <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(bond.slashTxHash)} target="_blank" rel="noreferrer">
                  BondSlashed tx
                </a>
              ) : null}
              {"refundTxHash" in bond && bond.refundTxHash ? (
                <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(bond.refundTxHash)} target="_blank" rel="noreferrer">
                  BondRefunded tx
                </a>
              ) : null}
              <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={fourMemeTokenUrl(bond.tokenAddress)} target="_blank" rel="noreferrer">
                Four.Meme token page
              </a>
            </div>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28">
          <div className="surface rounded-[2rem] p-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Honest framing</div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              This page does not claim full rug detection. It shows one public promise, the creator wallets behind it, and the onchain consequence attached to that promise.
            </p>
          </div>

          <BondActionPanel bondId={bond.id} creator={bond.creator} status={bond.status} expiresAtIso={bond.expiresAtIso} />

          <Link href={`/certificate/${bond.id}`} className="surface block rounded-[2rem] p-6 transition hover:border-[rgba(255,138,61,0.28)] hover:bg-white/[0.05]">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Certificate</div>
            <div className="mt-3 font-display text-2xl font-semibold text-zinc-50">Open the Bonded Launch Certificate</div>
            <div className="mt-3 text-sm leading-7 text-zinc-400">Creator-facing share page with proof links, launch context, and bond summary.</div>
          </Link>
        </aside>
      </div>
    </section>
  );
}

function BondMetric({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</div>
      <div className={`mt-3 break-all text-sm text-zinc-100 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function DossierCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="text-sm font-semibold text-zinc-100">{title}</div>
      <div className="mt-2 text-sm leading-7 text-zinc-400">{body}</div>
    </div>
  );
}

function StateRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[1.2rem] border border-white/8 bg-black/10 px-4 py-3">
      <span className="text-zinc-500">{label}</span>
      <span className={`text-right text-zinc-100 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
