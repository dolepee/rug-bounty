"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  decodeEventLog,
  formatEther,
  formatUnits,
  getAddress,
  isAddress,
  keccak256,
  parseEther,
  stringToHex,
  type Address,
  type Hex,
} from "viem";
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

    const launchTimestamp = BigInt(launchEvidence.launchTime);
    const expiresAt = launchTimestamp + BigInt(compiled.rule.expiresInSeconds);
    const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
    if (expiresAt <= nowSeconds) {
      setSubmitError("Oath duration has already elapsed since launch. Use a more recent launch or a longer duration.");
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

  const launchReady = Boolean(launchEvidence);
  const oathReady = Boolean(compiled?.rule);
  const walletReady = Boolean(walletAddress);
  const canSubmit = launchReady && oathReady && !submitLoading;

  return (
    <div>
      <section>
        <div className="warning-stripes warning-stripes--thin" />
        <div className="section-shell py-12 md:py-16">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="label-mono">Bond your launch</div>
              <h1 className="mt-3 hazard-title--sm">Write your promise.<br/>Stake the bond.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
                Paste a Four.Meme launch. Compile your public promise into one enforceable rule. Sign one transaction — the vault holds your bond until expiry or slash.
              </p>
            </div>
            <StepStrip
              launchReady={launchReady}
              oathReady={oathReady}
              walletReady={walletReady}
            />
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="hazard-card p-6 md:p-8">
            <div className="flex items-center gap-2">
              <span className={`live-dot live-dot--${launchReady ? "lime" : "yellow"}`} />
              <span className="label-mono">Step 1 / Launch evidence</span>
            </div>
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <input
                value={launchTxHash}
                onChange={(event) => handleLaunchTxHashChange(event.target.value)}
                placeholder="Paste a Four.Meme launch tx hash (0x...)"
                className="font-mono text-sm"
              />
              <button
                className="btn-hazard whitespace-nowrap"
                type="button"
                onClick={parseLaunchTx}
              >
                Parse launch
              </button>
            </div>
            {parserError ? <ErrorBox message={parserError} /> : null}

            {launchEvidence ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Fact label="Token" value={launchEvidence.token} mono />
                <Fact label="Creator" value={launchEvidence.creator} mono />
                <Fact label="Name" value={launchEvidence.name} />
                <Fact label="Symbol" value={launchEvidence.symbol} />
                <Fact label="Launch time" value={new Date(Number(launchEvidence.launchTime) * 1000).toLocaleString()} />
                <Fact label="Supply" value={launchChecks ? formatTokenUnits(launchChecks.totalSupply, launchEvidence.tokenDecimals) : "Loading…"} />
                <Fact label="Decimals" value={String(launchEvidence.tokenDecimals)} />
                <Fact label="Launch fee" value={`${formatEther(BigInt(launchEvidence.launchFee))} BNB`} />
              </div>
            ) : (
              <div className="mt-4 rounded border border-[var(--border)] bg-white/[0.015] p-4 text-sm text-white/70">
                Bond creation stays locked until a real Four.Meme launch is verified onchain.
              </div>
            )}

            {launchGuidance ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="label-mono">Floor guidance</span>
                  {launchGuidance.suggestedFirstLine ? (
                    <button className="btn-outline text-[11px]" type="button" onClick={applySuggestedFloor}>
                      Use recommended floor
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Fact label="Creator balance" value={launchGuidance.creatorBalanceLabel} />
                  <Fact label="Minimum floor" value={launchGuidance.minBondableFloorLabel} />
                  <Fact label="Recommended floor" value={launchGuidance.recommendedFloorLabel ?? "Buy more tokens first"} />
                  <Fact label="Suggested oath line" value={launchGuidance.suggestedFirstLine ?? "No safe floor yet"} />
                </div>
                {launchGuidance.warnings.length ? (
                  <div className="mt-4 space-y-2">
                    {launchGuidance.warnings.map((warning) => (
                      <ErrorBox key={warning} message={warning} />
                    ))}
                    <WarningBox message="Once a breach is flagged onchain, refund is permanently locked — even if the creator buys back above floor later." />
                  </div>
                ) : null}
              </div>
            ) : null}

            {launchChecksError ? <ErrorBox message={launchChecksError} /> : null}

            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <div className="flex items-center gap-2">
                <span className={`live-dot live-dot--${oathReady ? "lime" : "yellow"}`} />
                <span className="label-mono">Step 2 / Compile your oath</span>
              </div>

              <div className="mt-4 grid gap-4">
                <div>
                  <label className="label-mono mb-2 block">Oath text</label>
                  <textarea
                    value={oathText}
                    onChange={(event) => handleOathTextChange(event.target.value)}
                    className="text-sm"
                  />
                  <p className="mt-2 font-mono text-[11px] text-[var(--fg-muted)]">
                    AI isolates the single enforceable sentence. Social-only lines are dropped.
                  </p>
                </div>

                <div>
                  <label className="label-mono mb-2 block">Declared creator wallets</label>
                  <textarea
                    value={declaredWalletsInput}
                    onChange={(event) => setDeclaredWalletsInput(event.target.value)}
                    placeholder="0xcreator..., 0xmultisig..."
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button className="btn-hazard" onClick={runClassifier} disabled={loading} type="button">
                    {loading ? "Compiling…" : "Compile oath"}
                  </button>
                  <button className="btn-outline" onClick={connectWallet} type="button">
                    {walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "Connect wallet"}
                  </button>
                </div>
                {classifierError ? <ErrorBox message={classifierError} /> : null}
              </div>
            </div>

            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <div className="flex items-center gap-2">
                <span className={`live-dot live-dot--${canSubmit ? "yellow" : "muted"}`} />
                <span className="label-mono">Step 3 / Stake the bond</span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <label className="label-mono mb-2 block">Bond amount (BNB)</label>
                  <input
                    value={bondAmountBnb}
                    onChange={(event) => setBondAmountBnb(event.target.value)}
                    placeholder="0.003"
                    className="font-mono"
                  />
                  <p className="mt-2 font-mono text-[11px] text-[var(--fg-muted)]">
                    Minimum on current vault: {minBondLabel} BNB
                  </p>
                </div>
                <button
                  className="btn-hazard whitespace-nowrap"
                  onClick={submitBond}
                  disabled={!canSubmit}
                  type="button"
                >
                  {submitLoading ? "Submitting…" : "Create bond onchain"}
                </button>
              </div>

              <p className="mt-4 font-mono text-[11px] leading-relaxed text-[var(--fg-muted)]">
                This vault routes the 20% protocol leg to the burn address so self-slash always destroys real value.
              </p>

              {submitError ? <ErrorBox message={submitError} /> : null}

              {txHash ? (
                <div className="mt-5 rounded border border-[rgba(57,255,20,0.35)] bg-[rgba(57,255,20,0.08)] p-5">
                  <div className="flex items-center gap-2">
                    <span className="live-dot live-dot--lime" />
                    <span className="label-mono text-[var(--lime)]">Bond submitted</span>
                  </div>
                  <div className="mt-3 break-all font-mono text-xs text-white/85">{txHash}</div>
                  {createdBondId ? (
                    <div className="mt-4 space-y-3">
                      <div className="font-mono text-sm text-white/90">
                        Bond ID <span className="text-[var(--yellow)]">{createdBondId}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/bond/${createdBondId}?bondTxHash=${txHash}`} className="btn-outline text-[11px]">
                          Open proof page <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <Link href={`/certificate/${createdBondId}?bondTxHash=${txHash}`} className="btn-outline text-[11px]">
                          Open certificate <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <CopyButton
                          text={`${appUrl}/bond/${createdBondId}?bondTxHash=${txHash}`}
                          label="Copy bond link"
                          className="btn-outline text-[11px]"
                        />
                        <CopyButton
                          text={`${appUrl}/certificate/${createdBondId}?bondTxHash=${txHash}`}
                          label="Copy cert link"
                          className="btn-outline text-[11px]"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <aside className="flex flex-col gap-5">
            <div className="hazard-card p-6">
              <div className="label-mono">Case register</div>
              <div className="mt-4 space-y-3">
                <DataRow label="Vault" value={vaultAddress ? `${vaultAddress.slice(0, 8)}…${vaultAddress.slice(-6)}` : "not configured"} mono />
                <DataRow label="Min bond" value={`${minBondLabel} BNB`} />
                <DataRow label="Wallet" value={walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "not connected"} mono />
                <DataRow label="Launch parse" value={launchReady ? "verified" : "pending"} accent={launchReady ? "lime" : "muted"} />
                <DataRow label="Oath compile" value={oathReady ? "ready" : "pending"} accent={oathReady ? "lime" : "muted"} />
              </div>
            </div>

            <div className="hazard-card p-6">
              <div className="label-mono">Compiled rule</div>
              {compiled?.rule ? (
                <div className="mt-4 space-y-3">
                  <DataRow
                    label="Provider"
                    value={`${compiled.provider === "dgrid" ? "DGrid" : "Deterministic"}${compiled.model ? ` · ${compiled.model}` : ""}`}
                  />
                  <DataRow label="Rule" value={compiled.rule.type} mono />
                  <DataRow label="Floor" value={compiled.rule.declaredRetainedBalance} mono />
                  <DataRow label="Expires in" value={formatDurationLabel(compiled.rule.expiresInSeconds)} />
                  <div className="rounded border border-[var(--border)] bg-white/[0.015] p-3">
                    <div className="label-mono">Selected sentence</div>
                    <div className="mt-2 text-xs leading-relaxed text-white/80">
                      {compiled.selectedPromiseText ?? "No enforceable segment selected"}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-white/70">{compiled.humanSummary}</p>
                  {compiled.compileWarnings.length ? (
                    <div className="space-y-2">
                      {compiled.compileWarnings.map((warning) => (
                        <WarningBox key={warning} message={warning} />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-xs leading-relaxed text-white/70">
                  Compile your oath to see the exact rule the vault will enforce.
                </p>
              )}
            </div>

            <ClassifierCard title="Enforceable" tone="lime" items={grouped.enforceable} />
            <ClassifierCard title="Social-only" tone="yellow" items={grouped.social} />
            <ClassifierCard title="Rejected" tone="red" items={grouped.rejected} />
          </aside>
        </div>
      </section>

      <div className="mt-14 warning-stripes warning-stripes--thin" />
    </div>
  );
}

function StepStrip({
  launchReady,
  oathReady,
  walletReady,
}: {
  launchReady: boolean;
  oathReady: boolean;
  walletReady: boolean;
}) {
  const steps: Array<{ label: string; done: boolean }> = [
    { label: "Parse launch", done: launchReady },
    { label: "Compile oath", done: oathReady },
    { label: "Connect wallet", done: walletReady },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((step, index) => (
        <div
          key={step.label}
          className="flex items-center gap-2 rounded border border-[var(--border)] bg-white/[0.015] px-3 py-2"
        >
          <span className={`live-dot live-dot--${step.done ? "lime" : "muted"}`} />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/80">
            {String(index + 1).padStart(2, "0")} / {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded border border-[var(--border)] bg-white/[0.015] p-3">
      <div className="label-mono">{label}</div>
      <div className={`mt-1 break-all ${mono ? "font-mono text-xs" : "text-sm"} text-white/90`}>
        {value}
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  mono = false,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: "lime" | "muted";
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="label-mono">{label}</span>
      <span
        className={`text-right text-xs ${mono ? "font-mono" : ""} ${
          accent === "lime" ? "text-[var(--lime)]" : accent === "muted" ? "text-white/60" : "text-white/90"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mt-3 rounded border border-[rgba(255,46,46,0.35)] bg-[rgba(255,46,46,0.08)] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="live-dot live-dot--red" />
        <span className="label-mono text-[var(--red)]">Error</span>
      </div>
      <div className="mt-2 break-words font-mono text-xs text-white/85">{message}</div>
    </div>
  );
}

function WarningBox({ message }: { message: string }) {
  return (
    <div className="rounded border border-[var(--yellow-border)] bg-[var(--yellow-soft)] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="live-dot live-dot--yellow" />
        <span className="label-mono text-[var(--yellow)]">Heads up</span>
      </div>
      <div className="mt-2 break-words text-xs leading-relaxed text-white/90">{message}</div>
    </div>
  );
}

function ClassifierCard({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "lime" | "yellow" | "red";
  items: PromiseItem[];
}) {
  const color = tone === "lime" ? "var(--lime)" : tone === "yellow" ? "var(--yellow)" : "var(--red)";

  return (
    <div className="hazard-card p-6">
      <div className="flex items-center gap-2">
        <span className={`live-dot live-dot--${tone}`} />
        <span className="label-mono" style={{ color }}>{title}</span>
        <span className="ml-auto font-mono text-[11px] text-[var(--fg-muted)]">
          {items.length}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <div className="rounded border border-[var(--border)] bg-white/[0.015] px-3 py-2 text-xs text-white/50">
            None.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.text}
              className="rounded border border-[var(--border)] bg-white/[0.015] p-3"
            >
              <div className="text-xs leading-relaxed text-white/90">{item.text}</div>
              <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                {item.reason}
              </div>
              {item.suggestedRewrite ? (
                <div className="mt-2 font-mono text-[11px] text-white/70">Rewrite: {item.suggestedRewrite}</div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
