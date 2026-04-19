import Link from "next/link";
import { ArrowRight, ShieldAlert, Sparkles, SearchCheck, Bot, ScrollText } from "lucide-react";
import { getDirectoryBonds, getPrimaryShowcaseBond, showcaseProof } from "@/lib/data/showcase";
import { bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";

const proofModel = [
  { label: "Vault-enforced", detail: "current-state floor slash / refund" },
  { label: "App-verified", detail: "Four.Meme TokenCreate parse" },
  { label: "AI-assisted", detail: "promise classification and narration" },
];

export default async function HomePage() {
  const bonds = await getDirectoryBonds();
  const showcase = await getPrimaryShowcaseBond();

  return (
    <div className="pb-24">
      <section className="hero-glow">
        <div className="section-shell pt-14 pb-12">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 status-chip font-mono text-xs uppercase tracking-[0.24em]">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              RugBounty / Viral mode: Rug Me If You Can
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
              Pay me if I rug.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
              Four.Meme creators lock BNB behind one public promise about their own bag. If they break the floor, an autonomous hunter can call the vault and take the bond.
            </p>
            <p className="mx-auto mt-4 max-w-2xl rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm leading-7 text-amber-100">
              This does not detect every rug. It enforces one public promise with money attached.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/create" className="button-primary rounded-xl px-5 py-3 text-sm">
                Bond Your Launch
              </Link>
              <Link href="/directory" className="button-secondary rounded-xl px-5 py-3 text-sm">
                Bonded Launch Directory
              </Link>
            </div>
          </div>
        </div>
      </section>

      {showcase ? (
        <section className="section-shell -mt-2 mb-10">
          <div className="surface rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Live mainnet proof</div>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
                  {showcase.ticker} was launched, bonded, breached, and slashed on BNB mainnet.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                  This is the real showcase loop, not seed data. The creator launched BIBI on Four.Meme, bonded a 1.05M floor, sold below it, and the autonomous Rug Hunter captured the bond.
                </p>
              </div>
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Live status: {showcase.status}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a className="button-primary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(showcaseProof.launchTxHash)} target="_blank" rel="noreferrer">
                Launch tx
              </a>
              <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(showcaseProof.bondTxHash)} target="_blank" rel="noreferrer">
                BondCreated tx
              </a>
              <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(showcaseProof.slashTxHash)} target="_blank" rel="noreferrer">
                BondSlashed tx
              </a>
              <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={fourMemeTokenUrl(showcase.tokenAddress)} target="_blank" rel="noreferrer">
                Four.Meme token page
              </a>
              <Link href={`/bond/${showcase.id}?bondTxHash=${showcaseProof.bondTxHash}`} className="button-secondary rounded-xl px-4 py-3 text-sm">
                Open live bond page
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-shell">
        <div className="grid gap-4 md:grid-cols-3">
          {proofModel.map((item) => (
            <div key={item.label} className="surface rounded-2xl p-5">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">{item.label}</div>
              <div className="mt-3 text-sm text-zinc-200">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell mt-12">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="surface-strong rounded-2xl p-5">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Live launch proofs</div>
            <div className="mt-3 text-3xl font-semibold">{showcase ? 1 : 0}</div>
          </div>
          <div className="surface-strong rounded-2xl p-5">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Live slashes</div>
            <div className="mt-3 text-3xl font-semibold text-red-300">{showcase?.status === "SLASHED" ? 1 : 0}</div>
          </div>
          <div className="surface-strong rounded-2xl p-5">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Main rule</div>
            <div className="mt-3 text-lg font-semibold">CREATOR_WALLET_FLOOR</div>
          </div>
          <div className="surface-strong rounded-2xl p-5">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Agent mode</div>
            <div className="mt-3 text-lg font-semibold">Trigger only, not oracle</div>
          </div>
        </div>
      </section>

      <section className="section-shell mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface rounded-3xl p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-200">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Why this can win
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: SearchCheck,
                title: "Legible primitive",
                body: "Creator-initiated bond plus permissionless slash is easy to explain and hard to confuse with another scanner.",
              },
              {
                icon: Bot,
                title: "Visible agent loop",
                body: "The Rug Hunter Agent watches floor breaches and lands the slash tx itself. That is actual trigger -> action -> result.",
              },
              {
                icon: ScrollText,
                title: "Honest proof model",
                body: "The product says exactly what the vault enforces, what the app parses, and what AI only assists.",
              },
              {
                icon: ShieldAlert,
                title: "Creator incentive",
                body: "Bonded launches get a certificate page and a share card. The bond becomes a marketing asset, not just a punishment rail.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/8 bg-white/2 p-5">
                <item.icon className="h-5 w-5 text-amber-400" />
                <div className="mt-3 text-base font-semibold text-zinc-50">{item.title}</div>
                <div className="mt-2 text-sm leading-7 text-zinc-400">{item.body}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface rounded-3xl p-6">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Proof model</div>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/2 p-4">
              <div className="text-sm font-semibold text-zinc-100">Vault-enforced</div>
              <p className="mt-2 text-sm leading-7 text-zinc-400">
                The vault stores declared creator wallets, a retained-balance floor, expiry, and the BNB bond. `resolveBond` reads live balances and slashes only if the floor is breached before expiry.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/2 p-4">
              <div className="text-sm font-semibold text-zinc-100">App-verified</div>
              <p className="mt-2 text-sm leading-7 text-zinc-400">
                The app parses the real Four.Meme TokenCreate receipt and shows the raw launch data. The vault records the launch metadata for display, but does not claim on-chain verification.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/2 p-4">
              <div className="text-sm font-semibold text-zinc-100">AI-assisted</div>
              <p className="mt-2 text-sm leading-7 text-zinc-400">
                AI classifies promises into enforceable, social-only, and rejected claims. It compiles the bondable rule and narrates the result. It does not decide slash.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell mt-14">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Live proof directory</div>
            <h2 className="mt-2 text-2xl font-semibold">Real launches, not seeded screenshots</h2>
          </div>
          <Link href="/directory" className="inline-flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200">
            Open directory <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/8 bg-[rgba(17,22,31,0.88)]">
          <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr_0.8fr] gap-4 px-5 py-4 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            <div>Token</div>
            <div>Bond</div>
            <div>Floor</div>
            <div>Status</div>
            <div>Expiry</div>
          </div>
          {bonds.map((bond) => (
            <Link
              key={bond.id}
              href={`/bond/${bond.id}${bond.id === showcaseProof.bondId ? `?bondTxHash=${showcaseProof.bondTxHash}` : ""}`}
              className="table-row grid grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr_0.8fr] gap-4 px-5 py-4 text-sm"
            >
              <div>
                <div className="font-semibold text-zinc-100">{bond.ticker}</div>
                <div className="mt-1 text-zinc-500">{bond.tokenName}</div>
              </div>
              <div>{typeof bond.bondAmountBnb === "number" ? bond.bondAmountBnb.toFixed(2) : Number(bond.bondAmountBnb).toFixed(4)} BNB</div>
              <div>{bond.declaredFloor}</div>
              <div className={bond.status === "SLASHED" ? "metric-danger" : bond.status === "AT_RISK" ? "metric-warning" : "metric-positive"}>
                {bond.status}
              </div>
              <div className="text-zinc-400">{new Date(bond.expiresAtIso).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
