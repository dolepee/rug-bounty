import Link from "next/link";
import { ArrowUpRight, DatabaseZap, ShieldCheck } from "lucide-react";
import { getDirectoryBonds, refundProof, showcaseProof } from "@/lib/data/showcase";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const bonds = await getDirectoryBonds();
  const slashedCount = bonds.filter((bond) => bond.status === "SLASHED").length;
  const refundedCount = bonds.filter((bond) => bond.status === "REFUNDED").length;

  return (
    <section className="section-shell py-12">
      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="surface-strong rounded-[2rem] p-8">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 status-chip font-mono text-xs uppercase tracking-[0.24em]">
            <DatabaseZap className="h-3.5 w-3.5 text-[var(--accent)]" />
            Verified proof directory
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-zinc-50">
            A clean proof library, not a pile of seeded screenshots.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-300">
            Every row in this directory ties back to a real Four.Meme launch, a real bond, and a real onchain outcome. The tx links are curated evidence. The vault context is pulled from live state where it exists.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <DirectoryMetric label="Proof rows" value={String(bonds.length)} />
            <DirectoryMetric label="Slashed" value={String(slashedCount)} tone="danger" />
            <DirectoryMetric label="Refunded" value={String(refundedCount)} tone="success" />
          </div>
        </div>

        <div className="surface rounded-[2rem] p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">What this table means</div>
          <div className="mt-5 grid gap-3">
            <InfoCard title="Verified proof set" body="The displayed proof rows are deliberate public examples anchored to real tx chains, not synthetic fixtures or mock accounts." />
            <InfoCard title="Current vault context" body="Balances, status, and expiry fields are refreshed from the configured vault where available so the proof pages stay legible after settlement." />
            <InfoCard title="Four.Meme-native flow" body="The official create flow now hard-gates bond creation behind a successful Four.Meme TokenCreate parse." />
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bonds.map((bond) => (
          <Link
            key={bond.id}
            href={`/bond/${bond.id}${bond.bondTxHash ? `?bondTxHash=${bond.bondTxHash}` : ""}`}
            className="surface group rounded-[2rem] p-6 transition hover:-translate-y-0.5 hover:border-[rgba(255,138,61,0.28)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{bond.tokenName}</div>
                <div className="mt-2 font-display text-3xl font-semibold text-zinc-50">{bond.ticker}</div>
                {bond.id === showcaseProof.bondId ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-red-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Final slash proof
                  </div>
                ) : null}
                {bond.id === refundProof.bondId ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Final refund proof
                  </div>
                ) : null}
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

            <div className="mt-6 grid gap-3 text-sm">
              <DirectoryRow label="Bond" value={`${Number(bond.bondAmountBnb).toFixed(4)} BNB`} />
              <DirectoryRow label="Declared floor" value={bond.declaredFloor} />
              <DirectoryRow label="Current balance" value={bond.currentBalance} />
              <DirectoryRow label="Expiry" value={new Date(bond.expiresAtIso).toLocaleString()} />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--accent-soft)] transition group-hover:text-white">
              Open proof packet <ArrowUpRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DirectoryMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger";
}) {
  const valueClass =
    tone === "success" ? "text-emerald-200" : tone === "danger" ? "text-red-200" : "text-zinc-50";
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</div>
      <div className={`mt-3 text-4xl font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="text-sm font-semibold text-zinc-100">{title}</div>
      <div className="mt-2 text-sm leading-7 text-zinc-400">{body}</div>
    </div>
  );
}

function DirectoryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[1.2rem] border border-white/8 bg-black/10 px-4 py-3">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-100">{value}</span>
    </div>
  );
}
