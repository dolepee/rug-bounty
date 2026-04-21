"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import type { Address, Hex } from "viem";
import { connectInjectedWallet, getBrowserBscPublicClient } from "@/lib/chain/browser-wallet";
import { rugBountyVaultAbi } from "@/lib/chain/rug-bounty";
import { bscScanTxUrl } from "@/lib/fourmeme/links";

const cleanEnv = (value?: string | null) => value?.trim() || undefined;
const vaultAddress = cleanEnv(process.env.NEXT_PUBLIC_RUG_BOUNTY_VAULT_ADDRESS) as Address | undefined;
const postExpirySlashWindowMs = 10 * 60 * 1000;

type BondActionPanelProps = {
  bondId: string;
  creator: Address;
  status: "ACTIVE" | "AT_RISK" | "SLASHED" | "REFUNDED";
  expiresAtIso: string;
};

type ActionKind = "flagBreach" | "resolveBond" | "refundAfterExpiry";

export function BondActionPanel({ bondId, creator, status, expiresAtIso }: BondActionPanelProps) {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [pendingAction, setPendingAction] = useState<ActionKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successHash, setSuccessHash] = useState<Hex | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const isTerminal = status === "SLASHED" || status === "REFUNDED";
  const expiresAtMs = new Date(expiresAtIso).getTime();
  const isExpired = now >= expiresAtMs;
  const refundUnlocked = now >= expiresAtMs + postExpirySlashWindowMs;
  const canTrySlash = !isTerminal && now < expiresAtMs + postExpirySlashWindowMs;
  const canTryRefund = !isTerminal && refundUnlocked;

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  async function connectWallet() {
    const { address } = await connectInjectedWallet();
    setWalletAddress(address);
    return address;
  }

  async function submitAction(action: ActionKind) {
    setError(null);
    setSuccessHash(null);

    if (!vaultAddress) {
      setError("Vault address is not configured for this frontend deployment.");
      return;
    }

    if (!/^\d+$/.test(bondId)) {
      setError("Manual actions are only available for live numeric bond IDs.");
      return;
    }

    setPendingAction(action);
    try {
      const { walletClient, address } = await connectInjectedWallet();
      setWalletAddress(address);

      if (action === "refundAfterExpiry" && address.toLowerCase() !== creator.toLowerCase()) {
        throw new Error("Refund must be called by the original creator wallet.");
      }

      const hash = await walletClient.writeContract({
        address: vaultAddress,
        abi: rugBountyVaultAbi,
        functionName: action,
        args: [BigInt(bondId)],
        account: address,
      });

      setSuccessHash(hash);
      await getBrowserBscPublicClient().waitForTransactionReceipt({ hash });
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Transaction failed.");
    } finally {
      setPendingAction(null);
    }
  }

  const phaseDot =
    status === "SLASHED"
      ? "red"
      : status === "REFUNDED"
        ? "lime"
        : isExpired && !refundUnlocked
          ? "red"
          : refundUnlocked
            ? "lime"
            : "yellow";

  return (
    <div className="hazard-card p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="label-mono">Permissionless action surface</div>
          <h3 className="mt-2 hazard-title--sm">Slash. Flag. Refund.</h3>
        </div>
        <div className="inline-flex items-center gap-2">
          <span className={`live-dot live-dot--${phaseDot}`} />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
            {status} / {isExpired ? "expired" : "pre-expiry"} / {refundUnlocked ? "refund unlocked" : "hunter window"}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <ActionCard
          title="Flag breach"
          accent="red"
          description="Anyone can pin the breach while the balance is below floor. Locks refund."
          functionName="flagBreach"
          buttonLabel={pendingAction === "flagBreach" ? "Flagging..." : "Flag breach"}
          disabled={!canTrySlash || pendingAction !== null}
          onClick={() => submitAction("flagBreach")}
        />
        <ActionCard
          title="Slash bond"
          accent="yellow"
          description="Any non-declared wallet can try to slash. 80% to hunter, 20% to protocol."
          functionName="resolveBond"
          buttonLabel={pendingAction === "resolveBond" ? "Slashing..." : "Try to slash"}
          disabled={!canTrySlash || pendingAction !== null}
          primary
          onClick={() => submitAction("resolveBond")}
        />
        <ActionCard
          title="Claim refund"
          accent="lime"
          description="Creator-only. Unlocks after expiry + 10 minute hunter grace window."
          functionName="refundAfterExpiry"
          buttonLabel={pendingAction === "refundAfterExpiry" ? "Refunding..." : "Claim refund"}
          disabled={!canTryRefund || pendingAction !== null}
          onClick={() => submitAction("refundAfterExpiry")}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-5">
        <button className="btn-outline" type="button" onClick={connectWallet}>
          {walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "Connect wallet"}
        </button>
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
          {walletAddress ? "Wallet connected" : "Inject wallet to act"}
        </span>
      </div>

      {successHash ? (
        <div className="mt-5 rounded border border-[rgba(57,255,20,0.35)] bg-[rgba(57,255,20,0.08)] p-4">
          <div className="flex items-center gap-2">
            <span className="live-dot live-dot--lime" />
            <span className="label-mono text-[var(--lime)]">Action submitted</span>
          </div>
          <div className="mt-2 break-all font-mono text-xs text-white/85">{successHash}</div>
          <a
            href={bscScanTxUrl(successHash)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--lime)] hover:text-white"
          >
            View on BscScan <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded border border-[rgba(255,46,46,0.35)] bg-[rgba(255,46,46,0.08)] p-4">
          <div className="flex items-center gap-2">
            <span className="live-dot live-dot--red" />
            <span className="label-mono text-[var(--red)]">Transaction error</span>
          </div>
          <div className="mt-2 break-words font-mono text-xs text-white/85">{error}</div>
        </div>
      ) : null}
    </div>
  );
}

function ActionCard({
  title,
  accent,
  description,
  buttonLabel,
  disabled,
  primary,
  onClick,
}: {
  title: string;
  accent: "red" | "yellow" | "lime";
  description: string;
  functionName: string;
  buttonLabel: string;
  disabled: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded border border-[var(--border)] bg-white/[0.015] p-4">
      <div>
        <div className="flex items-center gap-2">
          <span className={`live-dot live-dot--${accent}`} />
          <span className="label-mono">{title}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/70">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`${primary ? "btn-hazard" : "btn-outline"} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
