"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Address, Hex } from "viem";
import { connectInjectedWallet, getBrowserBscPublicClient } from "@/lib/chain/browser-wallet";
import { rugBountyVaultAbi } from "@/lib/chain/rug-bounty";
import { bscScanTxUrl } from "@/lib/fourmeme/links";

const cleanEnv = (value?: string | null) => value?.trim() || undefined;
const vaultAddress = cleanEnv(process.env.NEXT_PUBLIC_RUG_BOUNTY_VAULT_ADDRESS) as Address | undefined;

type BondActionPanelProps = {
  bondId: string;
  creator: Address;
  status: "ACTIVE" | "AT_RISK" | "SLASHED" | "REFUNDED";
  expiresAtIso: string;
};

type ActionKind = "resolveBond" | "refundAfterExpiry";

export function BondActionPanel({ bondId, creator, status, expiresAtIso }: BondActionPanelProps) {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [pendingAction, setPendingAction] = useState<ActionKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successHash, setSuccessHash] = useState<Hex | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const isTerminal = status === "SLASHED" || status === "REFUNDED";
  const isExpired = now >= new Date(expiresAtIso).getTime();
  const canTrySlash = !isTerminal;
  const canTryRefund = !isTerminal;

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

  return (
    <div className="surface rounded-3xl p-6">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Manual action surface</div>
      <div className="mt-4 space-y-3 text-sm text-zinc-400">
        <p>Anyone can attempt <code>resolveBond</code>. If the floor is intact, the tx reverts. If the current balance is below the declared floor, the caller takes the bond.</p>
        <p>Only the creator can call <code>refundAfterExpiry</code>, and only after expiry while the bond is still active.</p>
        <p>
          Current state:
          <span className="ml-2 font-mono text-zinc-300">{status}</span>
          <span className="ml-4 font-mono text-zinc-300">{isExpired ? "expired" : "pre-expiry"}</span>
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="button-secondary rounded-xl px-4 py-3 text-sm" type="button" onClick={connectWallet}>
          {walletAddress ? `Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
        </button>
        <button
          className="button-primary rounded-xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!canTrySlash || pendingAction !== null}
          onClick={() => submitAction("resolveBond")}
        >
          {pendingAction === "resolveBond" ? "Submitting slash..." : "Try to slash"}
        </button>
        <button
          className="button-secondary rounded-xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!canTryRefund || pendingAction !== null}
          onClick={() => submitAction("refundAfterExpiry")}
        >
          {pendingAction === "refundAfterExpiry" ? "Submitting refund..." : "Claim refund"}
        </button>
      </div>

      {successHash ? (
        <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300/80">Action submitted</div>
          <div className="mt-2 break-all font-mono">{successHash}</div>
          <a className="mt-3 inline-flex text-emerald-50 underline underline-offset-4" href={bscScanTxUrl(successHash)} target="_blank" rel="noreferrer">
            View on BscScan
          </a>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}
