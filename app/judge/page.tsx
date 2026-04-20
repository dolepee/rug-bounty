import Link from "next/link";
import { bscScanAddressUrl, bscScanTxUrl, fourMemeTokenUrl } from "@/lib/fourmeme/links";
import { getCurrentMainnetProofs, refundProof, showcaseProof } from "@/lib/data/showcase";
import { getHunterRuntimeStatus } from "@/lib/data/hunter-status";
import { getConfiguredVaultAddress } from "@/lib/data/live-bonds";

const proofModel = [
  {
    label: "Vault-enforced",
    body: "Declared creator wallets, retained floor, bond amount, expiry, slash window, and refund window are enforced onchain.",
  },
  {
    label: "App-verified",
    body: "The app parses real Four.Meme TokenCreate launch transactions and shows launch metadata with proof links.",
  },
  {
    label: "AI-assisted",
    body: "AI only classifies promises and compiles enforceable rules. It does not decide slash or refund.",
  },
];

export default async function JudgeModePage() {
  const vaultAddress = getConfiguredVaultAddress();
  const proofs = await getCurrentMainnetProofs();
  const slashProofBond = proofs.find((bond) => bond.id === showcaseProof.bondId) ?? null;
  const refundProofBond = proofs.find((bond) => bond.id === refundProof.bondId) ?? null;
  const hunterStatus = await getHunterRuntimeStatus();

  return (
    <section className="section-shell py-12">
      <div className="mb-8 max-w-4xl">
        <div className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">Judge mode</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">A trust primitive for Four.Meme, with live proof.</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          Four.Meme makes launches fast. RugBounty adds the missing trust layer: one public, slashable promise about the creator&apos;s own bag. This page compresses the proof set into one surface: live vault, both mainnet outcomes, hunter runtime, and the exact proof model.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="surface rounded-3xl p-6">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Verified vault</div>
          <div className="mt-3 text-2xl font-semibold text-zinc-50">{vaultAddress ?? "not configured"}</div>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            The verified vault on BscScan is the contract that turns a creator promise into a narrow economic consequence. It is not trying to judge all rugs. It is enforcing one explicit launch commitment.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {vaultAddress ? (
              <>
                <a className="button-primary rounded-xl px-4 py-3 text-sm" href={bscScanAddressUrl(vaultAddress)} target="_blank" rel="noreferrer">
                  Open contract
                </a>
                <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={`${bscScanAddressUrl(vaultAddress)}#code`} target="_blank" rel="noreferrer">
                  View verified source
                </a>
              </>
            ) : null}
            <Link href="/create" className="button-secondary rounded-xl px-4 py-3 text-sm">
              Open bond flow
            </Link>
          </div>
        </div>

        <div className="surface rounded-3xl p-6">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Hunter runtime</div>
          <div className="mt-3 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Runtime</span>
              <span className="font-mono text-zinc-200">{hunterStatus.runtime.toUpperCase()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Status</span>
              <span className={hunterStatus.status === "online" ? "font-mono text-emerald-300" : "font-mono text-amber-300"}>
                {hunterStatus.status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Watcher identity</span>
              <span className="text-right text-zinc-300">public hunter not disclosed in status snapshot</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Watched vault</span>
              <span className="font-mono text-right text-zinc-300">{hunterStatus.vaultAddress ?? vaultAddress ?? "unknown"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Last heartbeat</span>
              <span className="text-right text-zinc-300">{hunterStatus.lastTickIso ? new Date(hunterStatus.lastTickIso).toLocaleString() : "unknown"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Watched bond ids</span>
              <span className="font-mono text-zinc-300">
                {hunterStatus.watchedBondIds.length ? hunterStatus.watchedBondIds.join(", ") : "none active"}
              </span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {hunterStatus.lastResolvedTxHash ? (
              <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(hunterStatus.lastResolvedTxHash)} target="_blank" rel="noreferrer">
                Latest hunter tx
              </a>
            ) : null}
            <a className="button-secondary rounded-xl px-4 py-3 text-sm" href="/api/hunter/status" target="_blank" rel="noreferrer">
              Raw hunter status
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {slashProofBond ? (
          <div className="surface rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Outcome A</div>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-50">{slashProofBond.ticker} slash proof</h2>
              </div>
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">SLASHED</div>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Token</span><span>{slashProofBond.tokenName}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Bond</span><span>{slashProofBond.bondAmountBnb} BNB</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Floor</span><span>{slashProofBond.declaredFloor}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Outcome</span><span>creator breached floor, hunter slashed</span></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a className="button-primary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(showcaseProof.launchTxHash)} target="_blank" rel="noreferrer">Launch</a>
              <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(showcaseProof.bondTxHash)} target="_blank" rel="noreferrer">Bond</a>
              <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(showcaseProof.slashTxHash)} target="_blank" rel="noreferrer">Slash</a>
              <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={fourMemeTokenUrl(slashProofBond.tokenAddress)} target="_blank" rel="noreferrer">Four.Meme</a>
              <Link href={`/bond/${slashProofBond.id}?bondTxHash=${showcaseProof.bondTxHash}`} className="button-secondary rounded-xl px-4 py-3 text-sm">Bond page</Link>
            </div>
          </div>
        ) : null}

        {refundProofBond ? (
          <div className="surface rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Outcome B</div>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-50">{refundProofBond.ticker} refund proof</h2>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">REFUNDED</div>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Token</span><span>{refundProofBond.tokenName}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Bond</span><span>{refundProofBond.bondAmountBnb} BNB</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Floor</span><span>{refundProofBond.declaredFloor}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Outcome</span><span>creator held floor, refunded after grace</span></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a className="button-primary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(refundProof.launchTxHash)} target="_blank" rel="noreferrer">Launch</a>
              <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(refundProof.bondTxHash)} target="_blank" rel="noreferrer">Bond</a>
              <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={bscScanTxUrl(refundProof.refundTxHash)} target="_blank" rel="noreferrer">Refund</a>
              <a className="button-secondary rounded-xl px-4 py-3 text-sm" href={fourMemeTokenUrl(refundProofBond.tokenAddress)} target="_blank" rel="noreferrer">Four.Meme</a>
              <Link href={`/bond/${refundProofBond.id}?bondTxHash=${refundProof.bondTxHash}`} className="button-secondary rounded-xl px-4 py-3 text-sm">Bond page</Link>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface rounded-3xl p-6">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Why Four.Meme specifically</div>
          <div className="mt-4 grid gap-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm leading-7 text-zinc-300">
              Four.Meme compresses launch speed, attention, and speculation into the same first few minutes. That makes trust the missing primitive, not more analytics.
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm leading-7 text-zinc-300">
              RugBounty gives an honest creator a stronger first message than “trust me”: a public promise with money attached, a proof page, and a certificate they can share immediately.
            </div>
          </div>
        </div>

        <div className="surface rounded-3xl p-6">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Demo budget note</div>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              The live proof bonds are intentionally small because they were cycled under hackathon budget on BNB mainnet.
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              That is a demo constraint, not a product constraint. The primitive scales independently of the amount used in the proof loops.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="surface rounded-3xl p-6">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Proof model</div>
          <div className="mt-4 grid gap-4">
            {proofModel.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div className="text-sm font-semibold text-zinc-100">{item.label}</div>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface rounded-3xl p-6">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Not claimed</div>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">This does not detect every rug.</div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">This does not detect hidden undeclared wallets.</div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">The vault records launch metadata for display, but does not verify Four.Meme history onchain.</div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">Slash is permissionless. The agent is a live hunter, not a privileged oracle.</div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">During the hackathon demo period, the 20% protocol leg routes to an author-controlled treasury. Production deployments should point it at a burn, DAO, or multisig.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
