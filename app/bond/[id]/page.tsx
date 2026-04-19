import Link from "next/link";
import { notFound } from "next/navigation";
import { getBondForPage } from "@/lib/data/showcase";
import { bscScanAddressUrl, bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";

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
  const bondAmountLabel =
    typeof bond.bondAmountBnb === "number" ? bond.bondAmountBnb.toFixed(2) : Number(bond.bondAmountBnb).toFixed(4);

  return (
    <section className="section-shell py-12">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="surface rounded-3xl p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">Bond detail</div>
              <h1 className="mt-2 text-4xl font-semibold">{bond.ticker}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">{bond.notes}</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-medium ${
              bond.status === "SLASHED"
                ? "bg-red-500/10 text-red-300"
                : bond.status === "AT_RISK"
                  ? "bg-amber-500/10 text-amber-300"
                  : "bg-emerald-500/10 text-emerald-300"
            }`}>
              {bond.status}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Proof model</div>
              <div className="mt-4 space-y-4 text-sm text-zinc-300">
                <div>
                  <div className="font-semibold text-zinc-100">Vault-enforced</div>
                  <div className="mt-1 text-zinc-400">Current-state floor slash / refund from declared wallets only.</div>
                </div>
                <div>
                  <div className="font-semibold text-zinc-100">App-verified</div>
                  <div className="mt-1 text-zinc-400">Four.Meme launch tx parsing and metadata display.</div>
                </div>
                <div>
                  <div className="font-semibold text-zinc-100">AI-assisted</div>
                  <div className="mt-1 text-zinc-400">Promise classification, rule compilation, outcome narration.</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Live state</div>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Bond size</span>
                  <span>{bondAmountLabel} BNB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Declared floor</span>
                  <span>{bond.declaredFloor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Current balance</span>
                  <span>{bond.currentBalance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Expiry</span>
                  <span>{new Date(bond.expiresAtIso).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/8 bg-[rgba(17,22,31,0.92)]">
            <div className="grid grid-cols-[1fr_1fr] gap-4 px-5 py-4 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              <div>Declared creator wallets</div>
              <div>Links</div>
            </div>
            {bond.declaredCreatorWallets.map((wallet) => (
              <div key={wallet} className="table-row grid grid-cols-[1fr_1fr] gap-4 px-5 py-4 text-sm">
                <div className="font-mono text-zinc-300">{wallet}</div>
                <a className="text-amber-300 hover:text-amber-200" href={bscScanAddressUrl(wallet)} target="_blank" rel="noreferrer">
                  View on BscScan
                </a>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {bondTxHash ? (
              <a className="button-primary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(bondTxHash)} target="_blank" rel="noreferrer">
                BondCreated tx
              </a>
            ) : null}
            <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(bond.launchTxHash)} target="_blank" rel="noreferrer">
              Four.Meme launch tx
            </a>
            {"slashTxHash" in bond && bond.slashTxHash ? (
              <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(bond.slashTxHash)} target="_blank" rel="noreferrer">
                BondSlashed tx
              </a>
            ) : null}
            <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={fourMemeTokenUrl(bond.tokenAddress)} target="_blank" rel="noreferrer">
              Four.Meme token page
            </a>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="surface rounded-3xl p-6">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Honest framing</div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              This does not detect every rug. It enforces one public promise with money attached.
            </p>
          </div>

          <div className="surface rounded-3xl p-6">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Action surface</div>
            <div className="mt-4 space-y-3 text-sm text-zinc-400">
              <p>Anyone can attempt `resolveBond`. If the floor is intact, the tx reverts. If the current balance is below the declared floor, the caller takes the bond.</p>
              <p>The autonomous Rug Hunter Agent is the default caller in the demo. A human hunter path still exists for transparency.</p>
            </div>
            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              Manual hunter action is permissionless in the product. The vault always re-checks live state onchain.
            </div>
          </div>

          <Link href={`/certificate/${bond.id}`} className="surface block rounded-3xl p-6 transition hover:border-amber-500/25 hover:bg-white/[0.05]">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Certificate</div>
            <div className="mt-2 text-lg font-semibold text-zinc-50">Open the Bonded Launch Certificate</div>
            <div className="mt-2 text-sm text-zinc-400">Creator-facing share page with proof links and bond summary.</div>
          </Link>
        </aside>
      </div>
    </section>
  );
}
