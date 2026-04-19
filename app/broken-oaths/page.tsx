import { getBrokenOathBonds, showcaseProof } from "@/lib/data/showcase";
import { bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";

export default async function BrokenOathsPage() {
  const broken = await getBrokenOathBonds();

  return (
    <section className="section-shell py-12">
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Wall of Broken Oaths</div>
        <h1 className="mt-2 text-4xl font-semibold">Every slashed bond, publicly visible</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
          This page is not the trust mechanism. The trust mechanism is the on-chain slash. The wall exists to make the outcomes legible and shareable.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {broken.map((bond) => (
          <div key={bond.id} className="surface rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">{bond.tokenName}</div>
                <div className="mt-2 text-2xl font-semibold">{bond.ticker}</div>
                {bond.id === showcaseProof.bondId ? <div className="mt-2 text-xs font-mono uppercase tracking-[0.2em] text-amber-300">Live BNB mainnet slash</div> : null}
              </div>
              <div className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">SLASHED</div>
            </div>
            <div className="mt-6 grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Declared floor</span>
                <span>{bond.declaredFloor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Balance at slash</span>
                <span>{bond.currentBalance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Bond paid</span>
                <span>{typeof bond.bondAmountBnb === "number" ? bond.bondAmountBnb.toFixed(2) : Number(bond.bondAmountBnb).toFixed(4)} BNB</span>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm leading-7 text-zinc-300">
              {bond.id === showcaseProof.bondId
                ? `${bond.ticker} broke its oath on BNB mainnet. The creator launched on Four.Meme, bonded a 1.05M floor, then sold below it. The autonomous Rug Hunter Agent landed the slash tx and took the bond.`
                : `${bond.ticker} broke its oath. The declared creator wallets fell below the public floor before expiry, and the first hunter to call the vault took the bond.`}
            </div>
            {bond.id === showcaseProof.bondId ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(showcaseProof.launchTxHash)} target="_blank" rel="noreferrer">
                  Launch tx
                </a>
                <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(showcaseProof.bondTxHash)} target="_blank" rel="noreferrer">
                  BondCreated tx
                </a>
                <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(showcaseProof.slashTxHash)} target="_blank" rel="noreferrer">
                  BondSlashed tx
                </a>
                <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={fourMemeTokenUrl(bond.tokenAddress)} target="_blank" rel="noreferrer">
                  Four.Meme token
                </a>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
