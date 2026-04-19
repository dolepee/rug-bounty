"use client";

import { useMemo, useState } from "react";
import { decodeEventLog, formatEther, getAddress, isAddress, keccak256, parseEther, stringToHex, type Address, type Hex } from "viem";
import { connectInjectedWallet, getBrowserBscPublicClient } from "@/lib/chain/browser-wallet";
import { rugBountyVaultAbi } from "@/lib/chain/rug-bounty";

type PromiseItem = {
  text: string;
  class: "enforceable" | "needs_social_proof" | "not_enforceable";
  reason: string;
  suggestedRewrite?: string;
};

type CompileResponse = {
  classified: PromiseItem[];
  enforceableCount: number;
  humanSummary: string;
  rule: {
    type: "CREATOR_WALLET_FLOOR";
    declaredRetainedBalance: string;
    expiresInSeconds: number;
  } | null;
};

type ParsedLaunchEvidence = {
  token: Address;
  creator: Address;
  requestId: string;
  name: string;
  symbol: string;
  totalSupply: string;
  launchTime: string;
  launchFee: string;
  tokenDecimals: number;
  blockNumber: string;
  txHash: Hex;
  tokenManager: Address;
  rawLogIndex: number;
};

const vaultAddress = process.env.NEXT_PUBLIC_RUG_BOUNTY_VAULT_ADDRESS as Address | undefined;

const initialText = `I will hold at least 1.05M BIBI tokens for 3 hours.\nBinance listing soon.\nDaily updates.`;

export default function CreateBondPage() {
  const [oathText, setOathText] = useState(initialText);
  const [launchTxHash, setLaunchTxHash] = useState("");
  const [declaredWalletsInput, setDeclaredWalletsInput] = useState("");
  const [bondAmountBnb, setBondAmountBnb] = useState("0.02");
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [compiled, setCompiled] = useState<CompileResponse | null>(null);
  const [parserResult, setParserResult] = useState<ParsedLaunchEvidence | null>(null);
  const [parserError, setParserError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [createdBondId, setCreatedBondId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function runClassifier() {
    setLoading(true);
    const response = await fetch("/api/oath/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: oathText, tokenDecimals: parserResult?.tokenDecimals ?? 18 }),
    });
    const data = await response.json();
    setCompiled(data);
    setLoading(false);
  }

  async function parseLaunchTx() {
    setParserError(null);
    setParserResult(null);

    if (!launchTxHash.trim()) {
      setParserError("Paste a Four.Meme mainnet launch tx hash first.");
      return;
    }

    const response = await fetch(`/api/fourmeme/launch/${launchTxHash.trim()}`);
    const data = await response.json();
    if (!response.ok) {
      setParserError(data.error || "Unable to parse launch transaction.");
      return;
    }
    setParserResult(data.parsed as ParsedLaunchEvidence);
    setDeclaredWalletsInput((current) => current || (data.parsed.creator as string));
  }

  const grouped = useMemo(() => {
    const items = compiled?.classified || [];
    return {
      enforceable: items.filter((item) => item.class === "enforceable"),
      social: items.filter((item) => item.class === "needs_social_proof"),
      rejected: items.filter((item) => item.class === "not_enforceable"),
    };
  }, [compiled]);

  async function connectWallet() {
    const { address } = await connectInjectedWallet();
    setWalletAddress(address);
    return address;
  }

  async function submitBond() {
    setSubmitError(null);
    setTxHash(null);
    setCreatedBondId(null);

    if (!vaultAddress) {
      setSubmitError("Missing NEXT_PUBLIC_RUG_BOUNTY_VAULT_ADDRESS. Deploy the vault and add it to the frontend env first.");
      return;
    }
    if (!parserResult) {
      setSubmitError("Parse a real Four.Meme launch transaction first.");
      return;
    }
    if (!compiled?.rule) {
      setSubmitError("Compile an enforceable oath before creating a bond.");
      return;
    }
    if (!bondAmountBnb.trim()) {
      setSubmitError("Enter a bond amount in BNB.");
      return;
    }

    const parsedWallets = Array.from(
      new Set(
        declaredWalletsInput
          .split(/[\s,]+/)
          .map((wallet) => wallet.trim())
          .filter(Boolean)
          .map((wallet) => {
            if (!isAddress(wallet)) {
              throw new Error(`Invalid declared wallet: ${wallet}`);
            }
            return getAddress(wallet);
          }),
      ),
    );

    if (parsedWallets.length === 0) {
      setSubmitError("At least one declared creator wallet is required.");
      return;
    }

    setSubmitLoading(true);
    try {
      const { walletClient, address } = await connectInjectedWallet();
      setWalletAddress(address);

      if (address !== getAddress(parserResult.creator)) {
        throw new Error("Connected wallet must match the creator wallet from the parsed Four.Meme launch.");
      }
      if (!parsedWallets.includes(address)) {
        throw new Error("Connected wallet must be included in the declared creator wallet list.");
      }

      const oathHash = keccak256(stringToHex(oathText));
      const rulesHash = keccak256(
        stringToHex(
          JSON.stringify({
            type: compiled.rule.type,
            declaredRetainedBalance: compiled.rule.declaredRetainedBalance,
            expiresInSeconds: compiled.rule.expiresInSeconds,
            declaredCreatorWallets: parsedWallets,
          }),
        ),
      );

      const launchTimestamp = BigInt(parserResult.launchTime);
      const expiresAt = launchTimestamp + BigInt(compiled.rule.expiresInSeconds);
      const hash = await walletClient.writeContract({
        address: vaultAddress,
        abi: rugBountyVaultAbi,
        functionName: "createBond",
        args: [
          getAddress(parserResult.token),
          parserResult.txHash,
          launchTimestamp,
          parsedWallets,
          BigInt(compiled.rule.declaredRetainedBalance),
          oathHash,
          rulesHash,
          expiresAt,
        ],
        value: parseEther(bondAmountBnb),
        account: address,
      });

      setTxHash(hash);
      const publicClient = getBrowserBscPublicClient();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const createdLog = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: rugBountyVaultAbi,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === "BondCreated";
        } catch {
          return false;
        }
      });

      if (createdLog) {
        const decoded = decodeEventLog({
          abi: rugBountyVaultAbi,
          data: createdLog.data,
          topics: createdLog.topics,
        });
        if (decoded.eventName === "BondCreated") {
          setCreatedBondId(decoded.args.bondId.toString());
        }
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Bond creation failed.");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <section className="section-shell py-12">
      <div className="mb-8">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Bond your launch</div>
        <h1 className="mt-2 text-4xl font-semibold">Compile one public promise into a slashable floor</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
          The classifier is not decorative. It decides whether a promise can anchor a bond, should stay as social-only, or must be rejected because the vault cannot enforce it.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface rounded-3xl p-6">
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Four.Meme launch tx hash</label>
              <div className="flex gap-3">
                <input value={launchTxHash} onChange={(event) => setLaunchTxHash(event.target.value)} placeholder="0x..." className="font-mono" />
                <button className="button-secondary rounded-xl px-4 py-3 text-sm" onClick={parseLaunchTx} type="button">
                  Parse
                </button>
              </div>
              {parserError ? <div className="mt-2 text-sm text-red-300">{parserError}</div> : null}
            </div>

            {parserResult ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm leading-7 text-zinc-300">
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Parsed launch evidence</div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <EvidenceRow label="Token" value={parserResult.token} mono />
                  <EvidenceRow label="Creator" value={parserResult.creator} mono />
                  <EvidenceRow label="Name" value={parserResult.name} />
                  <EvidenceRow label="Symbol" value={parserResult.symbol} />
                  <EvidenceRow label="Launch time" value={new Date(Number(parserResult.launchTime) * 1000).toLocaleString()} />
                  <EvidenceRow label="Decimals" value={String(parserResult.tokenDecimals)} />
                  <EvidenceRow label="Launch fee" value={`${formatEther(BigInt(parserResult.launchFee))} BNB`} />
                  <EvidenceRow label="Tx hash" value={parserResult.txHash} mono />
                </div>
              </div>
            ) : null}

            <div>
              <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Declared creator wallets</label>
              <textarea
                value={declaredWalletsInput}
                onChange={(event) => setDeclaredWalletsInput(event.target.value)}
                placeholder="0xcreator..., 0xmultisig..."
                className="font-mono"
              />
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Oath text</label>
              <textarea value={oathText} onChange={(event) => setOathText(event.target.value)} />
            </div>

            <div className="flex gap-3">
              <button className="button-primary rounded-xl px-5 py-3 text-sm" onClick={runClassifier} disabled={loading} type="button">
                {loading ? "Compiling..." : "Compile Oath"}
              </button>
              <button className="button-secondary rounded-xl px-5 py-3 text-sm" onClick={connectWallet} type="button">
                {walletAddress ? `Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
              </button>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                This does not detect every rug. It enforces one public promise with money attached.
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Bond amount</label>
                <input value={bondAmountBnb} onChange={(event) => setBondAmountBnb(event.target.value)} placeholder="0.02" className="font-mono" />
              </div>
              <div className="flex items-end">
                <button className="button-primary rounded-xl px-5 py-3 text-sm" onClick={submitBond} disabled={submitLoading} type="button">
                  {submitLoading ? "Submitting..." : "Create Bond Onchain"}
                </button>
              </div>
            </div>

            {submitError ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{submitError}</div> : null}
            {txHash ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300/80">Bond submitted</div>
                <div className="mt-2 font-mono break-all">{txHash}</div>
                {createdBondId ? (
                  <div className="mt-2">
                    Bond ID: <span className="font-mono">{createdBondId}</span>
                    <a href={`/bond/${createdBondId}?bondTxHash=${txHash}`} className="ml-3 text-emerald-50 underline underline-offset-4">
                      Open live bond page
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <ClassifierCard title="Enforceable" tone="green" items={grouped.enforceable} />
          <ClassifierCard title="Needs social proof" tone="amber" items={grouped.social} />
          <ClassifierCard title="Rejected" tone="red" items={grouped.rejected} />
          <div className="surface rounded-3xl p-6">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Compiled rule</div>
            {compiled?.rule ? (
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Rule type</span>
                  <span>{compiled.rule.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Declared floor</span>
                  <span className="font-mono break-all">{compiled.rule.declaredRetainedBalance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Expires in</span>
                  <span>{Math.floor(compiled.rule.expiresInSeconds / 3600)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Vault address</span>
                  <span className="font-mono text-xs">{vaultAddress || "not configured"}</span>
                </div>
                <p className="pt-3 text-zinc-400">{compiled.humanSummary}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">Compile an oath to get a bondable rule.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function EvidenceRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className={`mt-2 break-all text-sm text-zinc-200 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function ClassifierCard({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "green" | "amber" | "red";
  items: PromiseItem[];
}) {
  const palette = {
    green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-100",
    red: "border-red-500/20 bg-red-500/10 text-red-100",
  }[tone];

  return (
    <div className="surface rounded-3xl p-6">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">{title}</div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-500">No items in this bucket yet.</div>
        ) : (
          items.map((item) => (
            <div key={item.text} className={`rounded-2xl border p-4 text-sm ${palette}`}>
              <div className="font-medium">{item.text}</div>
              <div className="mt-2 leading-7 opacity-90">{item.reason}</div>
              {item.suggestedRewrite ? <div className="mt-2 font-mono text-xs opacity-80">Rewrite: {item.suggestedRewrite}</div> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
