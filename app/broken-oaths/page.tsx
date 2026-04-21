import { getBrokenOathBonds, showcaseProof } from "@/lib/data/showcase";
import { bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";

export const dynamic = "force-dynamic";

export default async function BrokenOathsPage() {
  const broken = await getBrokenOathBonds();

  return (
    <section className="section-shell py-12">
      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="surface-strong rounded-[1.5rem] p-8 lg:p-10">
          <div className="review-kicker">Wall of broken oaths</div>
          <h1 className="mt-3 max-w-4xl font-display text-5xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
            Every slashed bond, presented as public consequence.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-300">
            This page is not the trust mechanism. The trust mechanism is the onchain slash. This wall exists to make broken launch promises legible, public, and easy to inspect.
          </p>
        </div>

        <div className="surface rounded-[1.5rem] p-6">
          <div className="review-kicker">Reading note</div>
          <div className="mt-5 space-y-3">
            <InfoCell body="A slashed row means the creator fell below the declared floor before refund eligibility." />
            <InfoCell body="Slash is permissionless. The first valid hunter to execute takes the hunter leg of the bounty." />
            <InfoCell body="These rows are proof surfaces, not full reputation scoring or universal rug detection." />
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 xl:grid-cols-2">
        {broken.map((bond) => (
          <div key={bond.id} className="surface rounded-[1.5rem] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="review-kicker">{bond.tokenName}</div>
                <div className="mt-2 text-3xl font-semibold text-zinc-50">{bond.ticker}</div>
                {bond.id === showcaseProof.bondId ? (
                  <div className="mt-3 inline-flex rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
                    Final BNB mainnet slash proof
                  </div>
                ) : null}
              </div>
              <div className="inline-flex rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
                SLASHED
              </div>
            </div>

            <div className="mt-6 fact-strip cols-3">
              <FactCell label="Declared floor" value={bond.declaredFloor} />
              <FactCell label="Latest observed balance" value={bond.currentBalance} />
              <FactCell label="Bond paid" value={`${Number(bond.bondAmountBnb).toFixed(4)} BNB`} />
            </div>

            <div className="mt-6 rounded-[1rem] border border-white/8 bg-white/[0.025] p-4 text-sm leading-7 text-zinc-300">
              {bond.id === showcaseProof.bondId
                ? `${bond.ticker} broke its oath on BNB mainnet. The creator launched on Four.Meme, bonded a 1.05M floor, then sold below it. The watcher flagged the breach, and a public hunter won the slash race.`
                : `${bond.ticker} broke its oath. The declared creator wallets fell below the public floor before expiry, and the first hunter to call the vault took the bond.`}
            </div>

            {bond.id === showcaseProof.bondId ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <a className="button-primary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(showcaseProof.launchTxHash)} target="_blank" rel="noreferrer">
                  Launch tx
                </a>
                <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(showcaseProof.bondTxHash)} target="_blank" rel="noreferrer">
                  Bond tx
                </a>
                <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(showcaseProof.breachFlagTxHash)} target="_blank" rel="noreferrer">
                  Breach flag
                </a>
                <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={bscScanTxUrl(showcaseProof.slashTxHash)} target="_blank" rel="noreferrer">
                  Slash tx
                </a>
                <a className="button-secondary rounded-full px-4 py-2.5 text-sm" href={fourMemeTokenUrl(bond.tokenAddress)} target="_blank" rel="noreferrer">
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

function FactCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact-cell">
      <div className="fact-label">{label}</div>
      <div className="fact-value">{value}</div>
    </div>
  );
}

function InfoCell({ body }: { body: string }) {
  return (
    <div className="rounded-[1rem] border border-white/8 bg-white/[0.025] p-4 text-sm leading-7 text-zinc-300">
      {body}
    </div>
  );
}
