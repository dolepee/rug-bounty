"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, formatEther, formatUnits, getAddress, isAddress, keccak256, parseEther, stringToHex, type Address, type Hex } from "viem";
import { connectInjectedWallet, getBrowserBscPublicClient } from "@/lib/chain/browser-wallet";
import { erc20MetadataAbi } from "@/lib/chain/erc20";
import { rugBountyVaultAbi } from "@/lib/chain/rug-bounty";
import { CopyButton } from "@/app/components/copy-button";

type PromiseItem = {
  text: string;
  class: "enforceable" | "needs_social_proof" | "not_enforceable";
  reason: string;
  suggestedRewrite?: string;
};

type CompileResponse = {
  provider: "dgrid" | "deterministic";
  model: string | null;
  classified: PromiseItem[];
  enforceableCount: number;
  selectedPromiseText: string | null;
  compileWarnings: string[];
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

const cleanEnv = (value?: string | null) => value?.trim() || undefined;
const vaultAddress = cleanEnv(process.env.NEXT_PUBLIC_RUG_BOUNTY_VAULT_ADDRESS) as Address | undefined;
const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || "https://rug-bounty.vercel.app";
const minBondWei = parseEther("0.003");
const minBondLabel = formatEther(minBondWei);

const initialText = `I will hold at least 1.05M tokens for 15 minutes.\nBinance listing soon.\nDaily updates.`;
const minFloorBps = 10n;

type LaunchChecks = {
  creatorBalance: bigint;
  totalSupply: bigint;
  minBondableFloor: bigint;
  recommendedFloor: bigint | null;
};

function formatDurationLabel(seconds: number) {
  if (seconds % 86400 === 0) return `${seconds / 86400}d`;
  if (seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
}

function formatTokenUnits(value: bigint, decimals: number, maximumFractionDigits = 6) {
  const [whole, fraction = ""] = formatUnits(value, decimals).split(".");
  const trimmedFraction = fraction.slice(0, maximumFractionDigits).replace(/0+$/, "");
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}

export default function CreateBondPage() {
  const [oathText, setOathText] = useState(initialText);
  const [launchTxHash, setLaunchTxHash] = useState("");
  const [declaredWalletsInput, setDeclaredWalletsInput] = useState("");
  const [bondAmountBnb, setBondAmountBnb] = useState(minBondLabel);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [compiled, setCompiled] = useState<CompileResponse | null>(null);
  const [classifierError, setClassifierError] = useState<string | null>(null);
  const [parserResult, setParserResult] = useState<ParsedLaunchEvidence | null>(null);
  const [parserError, setParserError] = useState<string | null>(null);
  const [launchChecks, setLaunchChecks] = useState<LaunchChecks | null>(null);
  const [launchChecksError, setLaunchChecksError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [createdBondId, setCreatedBondId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const launchEvidence = useMemo(() => parserResult, [parserResult]);

  function handleLaunchTxHashChange(nextValue: string) {
    setLaunchTxHash(nextValue);
    setParserError(null);

    if (parserResult && nextValue.trim().toLowerCase() !== parserResult.txHash.toLowerCase()) {
      setCompiled(null);
      if (declaredWalletsInput.trim().toLowerCase() === parserResult.creator.toLowerCase()) {
        setDeclaredWalletsInput("");
      }
      setParserResult(null);
    }
  }

  async function runClassifier() {
    setLoading(true);
    setClassifierError(null);
    try {
      const response = await fetch("/api/oath/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: oathText, tokenDecimals: launchEvidence?.tokenDecimals ?? 18 }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Classifier request failed.");
      }
      setCompiled(data);
    } catch (error) {
      setCompiled(null);
      setClassifierError(error instanceof Error ? error.message : "Classifier request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function parseLaunchTx() {
    const previousParsed = parserResult;
    setParserError(null);
    setParserResult(null);
    setCompiled(null);

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
    setDeclaredWalletsInput((current) => {
      const normalized = current.trim().toLowerCase();
      const previousCreator = previousParsed?.creator.toLowerCase();
      return !normalized || (previousCreator && normalized === previousCreator) ? (data.parsed.creator as string) : current;
    });
  }

  const grouped = useMemo(() => {
    const items = compiled?.classified || [];
    return {
      enforceable: items.filter((item) => item.class === "enforceable"),
      social: items.filter((item) => item.class === "needs_social_proof"),
      rejected: items.filter((item) => item.class === "not_enforceable"),
    };
  }, [compiled]);

  useEffect(() => {
    let cancelled = false;

    async function loadLaunchChecks() {
      if (!launchEvidence) {
        setLaunchChecks(null);
        setLaunchChecksError(null);
        return;
      }

      try {
        const publicClient = getBrowserBscPublicClient();
        const [creatorBalance, totalSupply] = await Promise.all([
          publicClient.readContract({
            address: launchEvidence.token,
            abi: erc20MetadataAbi,
            functionName: "balanceOf",
            args: [launchEvidence.creator],
          }),
          publicClient.readContract({
            address: launchEvidence.token,
            abi: erc20MetadataAbi,
            functionName: "totalSupply",
          }),
        ]);

        if (cancelled) return;

        const minBondableFloor = (totalSupply * minFloorBps) / 10_000n;
        const recommendedFloor =
          creatorBalance > minBondableFloor
            ? ((creatorBalance * 9n) / 10n > minBondableFloor ? (creatorBalance * 9n) / 10n : minBondableFloor)
            : null;

        setLaunchChecks({
          creatorBalance,
          totalSupply,
          minBondableFloor,
          recommendedFloor,
        });
        setLaunchChecksError(null);
      } catch (error) {
        if (cancelled) return;
        setLaunchChecks(null);
        setLaunchChecksError(error instanceof Error ? error.message : "Unable to read creator balance and total supply.");
      }
    }

    void loadLaunchChecks();

    return () => {
      cancelled = true;
    };
  }, [launchEvidence]);

  const compiledFloorRaw = compiled?.rule ? BigInt(compiled.rule.declaredRetainedBalance) : null;

  const launchGuidance = (() => {
    if (!launchEvidence || !launchChecks) {
      return null;
    }

    const warnings: string[] = [];
    if (compiledFloorRaw !== null) {
      if (compiledFloorRaw < launchChecks.minBondableFloor) {
        warnings.push(`Compiled floor is below the vault minimum of ${formatTokenUnits(launchChecks.minBondableFloor, launchEvidence.tokenDecimals)} ${launchEvidence.symbol}. createBond will revert.`);
      }
      if (compiledFloorRaw > launchChecks.creatorBalance) {
        warnings.push(`Compiled floor is above the creator wallet balance of ${formatTokenUnits(launchChecks.creatorBalance, launchEvidence.tokenDecimals)} ${launchEvidence.symbol}. createBond will revert.`);
      }
      if (compiledFloorRaw <= launchChecks.creatorBalance) {
        const breachRoom = launchChecks.creatorBalance - compiledFloorRaw;
        if (breachRoom === 0n) {
          warnings.push("Compiled floor leaves zero breach room. The demo cannot cleanly prove a slash without buying more tokens first.");
        }
      }
    }

    return {
      warnings,
      creatorBalanceLabel: `${formatTokenUnits(launchChecks.creatorBalance, launchEvidence.tokenDecimals)} ${launchEvidence.symbol}`,
      minBondableFloorLabel: `${formatTokenUnits(launchChecks.minBondableFloor, launchEvidence.tokenDecimals)} ${launchEvidence.symbol}`,
      recommendedFloorLabel: launchChecks.recommendedFloor
        ? `${formatTokenUnits(launchChecks.recommendedFloor, launchEvidence.tokenDecimals)} ${launchEvidence.symbol}`
        : null,
      suggestedFirstLine: launchChecks.recommendedFloor
        ? `I will hold at least ${formatTokenUnits(launchChecks.recommendedFloor, launchEvidence.tokenDecimals)} ${launchEvidence.symbol} tokens for ${compiled?.rule ? formatDurationLabel(compiled.rule.expiresInSeconds) : "15m"}.`
        : null,
    };
  })();

  function applySuggestedFloor() {
    if (!launchGuidance?.suggestedFirstLine) {
      return;
    }

    const lines = oathText.split("\n");
    const next = [launchGuidance.suggestedFirstLine, ...lines.slice(1)].join("\n");
    setOathText(next);
  }

  function handleOathTextChange(nextValue: string) {
    setCompiled(null);
    setOathText(nextValue);
  }

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
    if (!launchEvidence) {
      setSubmitError("Bond creation is gated behind a successful real Four.Meme launch parse.");
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

      if (address !== getAddress(launchEvidence.creator)) {
        throw new Error("Connected wallet must match the creator wallet from the parsed Four.Meme launch.");
      }
      if (!parsedWallets.includes(address)) {
        throw new Error("Connected wallet must be included in the declared creator wallet list.");
      }

      const bondAmountWei = parseEther(bondAmountBnb);
      if (bondAmountWei < minBondWei) {
        throw new Error(`Bond amount must be at least ${minBondLabel} BNB on the current vault.`);
      }

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

      const launchTimestamp = BigInt(launchEvidence.launchTime);
      const expiresAt = launchTimestamp + BigInt(compiled.rule.expiresInSeconds);
      const hash = await walletClient.writeContract({
        address: vaultAddress,
        abi: rugBountyVaultAbi,
        functionName: "createBond",
        args: [
          getAddress(launchEvidence.token),
          launchEvidence.txHash,
          launchTimestamp,
          parsedWallets,
          BigInt(compiled.rule.declaredRetainedBalance),
          oathText,
          rulesHash,
          expiresAt,
        ],
        value: bondAmountWei,
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
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="surface-strong p-8 lg:p-10">
          <div className="status-chip inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.24em]">
            Bond instrument builder
          </div>
          <div className="mt-7 review-kicker">Submission packet / evidence first / signature last</div>
          <h1 className="mt-3 max-w-4xl font-display text-5xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
            Draft the one sentence the vault will actually enforce.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-300">
            This page should read like a transaction dossier, not an internal console. First verify the launch. Then narrow the claim. Then sign one onchain bond against the configured vault.
          </p>
          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            <NarrativeCell label="01 / Verify launch" body="A real Four.Meme launch transaction is required before the official bond path opens." />
            <NarrativeCell label="02 / Narrow the claim" body="AI isolates the enforceable sentence instead of bonding the full block of launch hype." />
            <NarrativeCell label="03 / Sign the bond" body="The creator wallet signs one transaction against the configured vault and public proof path." />
          </div>
        </div>

        <div className="surface p-6">
          <div className="review-kicker">Filing notes</div>
          <div className="mt-5 space-y-3">
            <Guardrail body="The official bond flow is hard-gated to a successful real Four.Meme parse. If parsing fails, the fix is the evidence path, not manual launch spoofing." />
            <Guardrail body="The creator wallet from the parse must match the connected signer and must appear in the declared creator wallet list." />
            <Guardrail body={`Minimum bond on the current vault is ${minBondLabel} BNB. Current vault: ${vaultAddress || "not configured"}.`} accent />
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface p-6">
          <div className="review-kicker">Bond drafting flow</div>
          <div className="mt-6 grid gap-8">
            <div>
              <div className="review-kicker">Step 1 / launch evidence</div>
              <div className="mt-3 flex gap-3">
                <input value={launchTxHash} onChange={(event) => handleLaunchTxHashChange(event.target.value)} placeholder="Paste a Four.Meme launch tx hash" className="font-mono" />
                <button className="button-secondary rounded-full px-4 py-3 text-sm" onClick={parseLaunchTx} type="button">
                  Parse
                </button>
              </div>
              {parserError ? <div className="mt-3 rounded-[0.9rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{parserError}</div> : null}
            </div>

            {launchEvidence ? (
              <div className="grid gap-4">
                <div>
                  <div className="review-kicker">Parsed launch evidence</div>
                  <div className="mt-4 fact-strip cols-4">
                    <EvidenceRow label="Token" value={launchEvidence.token} mono />
                    <EvidenceRow label="Creator" value={launchEvidence.creator} mono />
                    <EvidenceRow label="Name" value={launchEvidence.name} />
                    <EvidenceRow label="Symbol" value={launchEvidence.symbol} />
                    <EvidenceRow label="Launch time" value={new Date(Number(launchEvidence.launchTime) * 1000).toLocaleString()} />
                    <EvidenceRow label="Total supply" value={launchChecks ? formatTokenUnits(launchChecks.totalSupply, launchEvidence.tokenDecimals) : "Loading…"} />
                    <EvidenceRow label="Decimals" value={String(launchEvidence.tokenDecimals)} />
                    <EvidenceRow label="Launch fee" value={`${formatEther(BigInt(launchEvidence.launchFee))} BNB`} />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="review-kicker">Launch checks</div>
                    {launchGuidance?.suggestedFirstLine ? (
                      <button className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-soft)] hover:text-white" type="button" onClick={applySuggestedFloor}>
                        Use recommended floor
                      </button>
                    ) : null}
                  </div>
                  {launchChecksError ? <div className="mt-3 rounded-[0.9rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{launchChecksError}</div> : null}
                  {launchGuidance ? (
                    <div className="mt-4 fact-strip cols-4">
                      <EvidenceRow label="Creator balance" value={launchGuidance.creatorBalanceLabel} />
                      <EvidenceRow label="Minimum floor" value={launchGuidance.minBondableFloorLabel} />
                      <EvidenceRow label="Recommended floor" value={launchGuidance.recommendedFloorLabel ?? "Buy more tokens first"} />
                      <EvidenceRow label="Suggested first line" value={launchGuidance.suggestedFirstLine ?? "No safe floor yet"} />
                    </div>
                  ) : null}
                  {launchGuidance?.warnings.length ? (
                    <div className="mt-4 space-y-2">
                      {launchGuidance.warnings.map((warning) => (
                        <div key={warning} className="rounded-[0.9rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                          {warning}
                        </div>
                      ))}
                      <div className="rounded-[0.9rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Once a floor breach is flagged onchain, refund is permanently locked even if the creator later buys back above floor.
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-[1rem] border border-white/8 bg-white/[0.025] p-4 text-sm leading-7 text-zinc-400">
                Parse a real launch first. The official bond path stays closed until launch evidence is verified.
              </div>
            )}

            <div className="section-rule" />

            <div>
              <div className="review-kicker">Step 2 / claim draft</div>
              <div className="mt-4 grid gap-5">
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
                  <textarea value={oathText} onChange={(event) => handleOathTextChange(event.target.value)} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button className="button-primary rounded-lg px-5 py-3 text-sm" onClick={runClassifier} disabled={loading} type="button">
                    {loading ? "Compiling..." : "Compile Claim"}
                  </button>
                  <button className="button-secondary rounded-lg px-5 py-3 text-sm" onClick={connectWallet} type="button">
                    {walletAddress ? `Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
                  </button>
                </div>
              </div>
            </div>

            <div className="section-rule" />

            <div>
              <div className="review-kicker">Step 3 / bond transaction</div>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <div>
                  <label className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Bond amount</label>
                  <input value={bondAmountBnb} onChange={(event) => setBondAmountBnb(event.target.value)} placeholder="0.02" className="font-mono" />
                  <div className="mt-2 text-xs text-zinc-500">Minimum bond on the current vault: {minBondLabel} BNB.</div>
                </div>
                <div className="flex items-end">
                  <button
                    className="button-primary rounded-lg px-5 py-3 text-sm"
                    onClick={submitBond}
                    disabled={submitLoading || !compiled?.rule || !launchEvidence}
                    type="button"
                  >
                    {submitLoading ? "Submitting..." : "Create Bond Onchain"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[1rem] border border-white/8 bg-white/[0.025] p-4 text-sm leading-7 text-zinc-300">
              During the hackathon demo period, the 20% protocol leg routes to an author-controlled treasury. Production deployments should point it at a burn, DAO, or multisig.
            </div>

            {classifierError ? <div className="rounded-[0.9rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{classifierError}</div> : null}
            {submitError ? <div className="rounded-[0.9rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{submitError}</div> : null}

            {txHash ? (
              <div className="rounded-[1rem] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <div className="review-kicker text-emerald-300/80">Bond submitted</div>
                <div className="mt-3 font-mono break-all">{txHash}</div>
                {createdBondId ? (
                  <div className="mt-4">
                    <div>
                      Bond ID: <span className="font-mono">{createdBondId}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={`/bond/${createdBondId}?bondTxHash=${txHash}`} className="button-secondary rounded-lg px-3 py-2 text-xs">
                        Open proof page
                      </a>
                      <a href={`/certificate/${createdBondId}`} className="button-secondary rounded-lg px-3 py-2 text-xs">
                        Open certificate
                      </a>
                      <CopyButton
                        text={`${appUrl}/bond/${createdBondId}?bondTxHash=${txHash}`}
                        label="Copy bond link"
                        className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-50 transition hover:border-emerald-400/40 hover:bg-emerald-500/15"
                      />
                      <CopyButton
                        text={`${appUrl}/certificate/${createdBondId}`}
                        label="Copy certificate link"
                        className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-50 transition hover:border-emerald-400/40 hover:bg-emerald-500/15"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-28">
          <div className="surface p-6">
            <div className="review-kicker">Case register</div>
            <div className="mt-5 data-list">
              <DataRow label="Vault address" value={vaultAddress || "not configured"} mono />
              <DataRow label="Minimum bond" value={`${minBondLabel} BNB`} />
              <DataRow label="Connected wallet" value={walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "not connected"} />
              <DataRow label="Launch parse" value={launchEvidence ? "verified" : "pending"} />
              <DataRow label="Compilation" value={compiled?.rule ? "ready" : "pending"} />
            </div>
          </div>

          <div className="surface p-6">
            <div className="review-kicker">Compiled rule</div>
            {compiled?.rule ? (
              <div className="mt-5">
                <div className="data-list">
                  <DataRow label="Provider" value={`${compiled.provider === "dgrid" ? "DGrid" : "Deterministic fallback"}${compiled.model ? ` · ${compiled.model}` : ""}`} />
                  <DataRow label="Rule type" value={compiled.rule.type} />
                  <DataRow label="Declared floor" value={compiled.rule.declaredRetainedBalance} mono />
                  <DataRow label="Expires in" value={formatDurationLabel(compiled.rule.expiresInSeconds)} />
                  <DataRow label="Compiled from" value={compiled.selectedPromiseText ?? "No enforceable segment selected"} />
                </div>
                <p className="mt-5 text-sm leading-7 text-zinc-400">{compiled.humanSummary}</p>
                {compiled.compileWarnings.length ? (
                  <div className="mt-4 space-y-2">
                    {compiled.compileWarnings.map((warning) => (
                      <div key={warning} className="rounded-[0.9rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        {warning}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-zinc-500">Compile the creator text to generate the exact rule the vault will enforce.</p>
            )}
          </div>

          <ClassifierCard title="Enforceable sentence" tone="green" items={grouped.enforceable} />
          <ClassifierCard title="Social-only statements" tone="amber" items={grouped.social} />
          <ClassifierCard title="Rejected statements" tone="red" items={grouped.rejected} />
        </div>
      </div>
    </section>
  );
}

function NarrativeCell({ label, body }: { label: string; body: string }) {
  return (
    <div className="fact-cell">
      <div className="fact-label">{label}</div>
      <div className="fact-value">{body}</div>
    </div>
  );
}

function EvidenceRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="fact-cell">
      <div className="fact-label">{label}</div>
      <div className={`fact-value break-all ${mono ? "font-mono text-xs sm:text-sm" : ""}`}>{value}</div>
    </div>
  );
}

function Guardrail({ body, accent = false }: { body: string; accent?: boolean }) {
  return (
    <div className={`rounded-[1rem] border p-4 text-sm leading-7 ${accent ? "border-amber-500/20 bg-amber-500/10 text-amber-100" : "border-white/8 bg-white/[0.025] text-zinc-300"}`}>
      {body}
    </div>
  );
}

function DataRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="data-row">
      <div className="data-row-label">{label}</div>
      <div className={`data-row-value ${mono ? "font-mono text-xs sm:text-sm" : ""}`}>{value}</div>
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
    <div className="surface rounded-[1.5rem] p-6">
      <div className="review-kicker">{title}</div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-[1rem] border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-500">No items in this bucket yet.</div>
        ) : (
          items.map((item) => (
            <div key={item.text} className={`rounded-[1rem] border p-4 text-sm ${palette}`}>
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
