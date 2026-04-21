import Link from "next/link";
import { ArrowUpRight, DatabaseZap } from "lucide-react";
import { getDirectoryBonds } from "@/lib/data/showcase";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const bonds = await getDirectoryBonds();
  const slashedCount = bonds.filter((bond) => bond.status === "SLASHED").length;
  const refundedCount = bonds.filter((bond) => bond.status === "REFUNDED").length;

  return (
    <section className="section-shell py-12">
      <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="surface-strong rounded-[1.5rem] p-8 lg:p-10">
          <div className="status-chip inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.24em]">
            <DatabaseZap className="h-3.5 w-3.5 text-[var(--accent)]" />
            Verified proof directory
          </div>
          <div className="mt-7 review-kicker">Curated evidence / real tx chains / live vault context</div>
          <h1 className="mt-3 max-w-4xl font-display text-5xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
            A proof library reviewers can audit quickly.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-300">
            Each row points to a real Four.Meme launch, a real bond, and a real onchain outcome. The examples are curated.
            The contract context is refreshed from the configured vault where current state still matters.
          </p>
          <div className="mt-8 fact-strip cols-3">
            <StatCell label="Proof rows" value={String(bonds.length)} />
            <StatCell label="Slashed" value={String(slashedCount)} tone="danger" />
            <StatCell label="Refunded" value={String(refundedCount)} tone="success" />
          </div>
        </div>

        <div className="surface rounded-[1.5rem] p-6">
          <div className="review-kicker">Reading guide</div>
          <div className="mt-5 space-y-3">
            <GuideCell
              title="Verified proof set"
              body="These rows are deliberate public examples backed by real tx chains. They are not live-indexed across the entire chain."
            />
            <GuideCell
              title="Current vault context"
              body="Displayed balance and expiry fields are refreshed from configured vault state where available so the proof pages stay legible after settlement."
            />
            <GuideCell
              title="Official create flow"
              body="The official bond flow requires a successful real Four.Meme TokenCreate parse. Generic manual launch spoofing is not part of the product path."
            />
          </div>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-[1.5rem] border border-white/8 bg-[rgba(17,21,27,0.96)]">
        <div className="overflow-x-auto">
          <div className="min-w-[920px]">
            <div className="grid grid-cols-[1.25fr_0.7fr_0.8fr_0.85fr_0.95fr_1fr] gap-4 px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              <div>Proof</div>
              <div>Bond</div>
              <div>Floor</div>
              <div>Status</div>
              <div>Current balance</div>
              <div>Window</div>
            </div>
            {bonds.map((bond) => (
              <Link
                key={bond.id}
                href={`/bond/${bond.id}${bond.bondTxHash ? `?bondTxHash=${bond.bondTxHash}` : ""}`}
                className="table-row grid grid-cols-[1.25fr_0.7fr_0.8fr_0.85fr_0.95fr_1fr] gap-4 px-5 py-5 text-sm"
              >
                <div>
                  <div className="flex items-center gap-2 text-zinc-100">
                    <span className="font-semibold">{bond.ticker}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                  <div className="mt-1 text-zinc-500">{bond.tokenName}</div>
                </div>
                <div className="text-zinc-100">{Number(bond.bondAmountBnb).toFixed(4)} BNB</div>
                <div className="text-zinc-100">{bond.declaredFloor}</div>
                <div className={bond.status === "SLASHED" ? "metric-danger" : bond.status === "REFUNDED" ? "metric-positive" : "metric-warning"}>
                  {bond.status}
                </div>
                <div className="text-zinc-300">{bond.currentBalance}</div>
                <div className="text-zinc-400">{new Date(bond.expiresAtIso).toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCell({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass = tone === "success" ? "text-emerald-200" : tone === "danger" ? "text-red-200" : "text-zinc-50";
  return (
    <div className="fact-cell">
      <div className="fact-label">{label}</div>
      <div className={`fact-value strong ${toneClass}`}>{value}</div>
    </div>
  );
}

function GuideCell({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1rem] border border-white/8 bg-white/[0.025] p-4">
      <div className="text-sm font-semibold text-zinc-100">{title}</div>
      <div className="mt-2 text-sm leading-7 text-zinc-400">{body}</div>
    </div>
  );
}
