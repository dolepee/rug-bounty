import Link from "next/link";
import { getDirectoryBonds, refundProof, showcaseProof } from "@/lib/data/showcase";

export default async function DirectoryPage() {
  const bonds = await getDirectoryBonds();

  return (
    <section className="section-shell py-12">
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Live proof directory</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Real bonds, live floor checks, no padded fixtures</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
          This directory only surfaces real proof loops. Each row must tie back to a real Four.Meme launch, a real bond, and an onchain outcome.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bonds.map((bond) => (
          <Link
            key={bond.id}
            href={`/bond/${bond.id}${bond.bondTxHash ? `?bondTxHash=${bond.bondTxHash}` : ""}`}
            className="surface rounded-3xl p-6 transition hover:-translate-y-0.5 hover:border-amber-500/25 hover:bg-white/[0.05]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">{bond.tokenName}</div>
                <div className="mt-2 text-2xl font-semibold">{bond.ticker}</div>
                {bond.id === showcaseProof.bondId ? <div className="mt-2 text-xs font-mono uppercase tracking-[0.2em] text-amber-300">Live BNB mainnet slash</div> : null}
                {bond.id === refundProof.bondId ? <div className="mt-2 text-xs font-mono uppercase tracking-[0.2em] text-emerald-300">Live BNB mainnet refund</div> : null}
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
            <div className="mt-6 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Bond</span>
                <span>{Number(bond.bondAmountBnb).toFixed(4)} BNB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Declared floor</span>
                <span>{bond.declaredFloor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Current balance</span>
                <span>{bond.currentBalance}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Expiry</span>
                <span>{new Date(bond.expiresAtIso).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
