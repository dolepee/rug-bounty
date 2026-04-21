"use client";

import { useEffect, useMemo, useState } from "react";

const postExpirySlashWindowMs = 10 * 60 * 1000;

function formatDateTime(dateMs: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(dateMs));
}

function formatUtc(dateMs: number) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(dateMs));
}

function formatCountdown(targetMs: number, nowMs: number) {
  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) {
    return "0m 0s";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

type BondTimePanelProps = {
  expiresAtIso: string;
  status: "ACTIVE" | "AT_RISK" | "SLASHED" | "REFUNDED";
};

type Phase = "pre-expiry" | "hunter-window" | "refund-unlocked" | "slashed" | "refunded";

export function BondTimePanel({ expiresAtIso, status }: BondTimePanelProps) {
  const [now, setNow] = useState(() => Date.now());
  const [timeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const expiresAtMs = useMemo(() => new Date(expiresAtIso).getTime(), [expiresAtIso]);
  const refundUnlockMs = expiresAtMs + postExpirySlashWindowMs;

  const phase: Phase =
    status === "SLASHED"
      ? "slashed"
      : status === "REFUNDED"
        ? "refunded"
        : now < expiresAtMs
          ? "pre-expiry"
          : now < refundUnlockMs
            ? "hunter-window"
            : "refund-unlocked";

  const targetLabel =
    phase === "pre-expiry"
      ? "Expires in"
      : phase === "hunter-window"
        ? "Refund unlocks in"
        : phase === "refund-unlocked"
          ? "Refund window open"
          : phase === "slashed"
            ? "Bond slashed"
            : "Bond refunded";

  const countdownValue =
    phase === "pre-expiry"
      ? formatCountdown(expiresAtMs, now)
      : phase === "hunter-window"
        ? formatCountdown(refundUnlockMs, now)
        : "0m 0s";

  const dotVariant =
    phase === "slashed"
      ? "red"
      : phase === "refunded"
        ? "lime"
        : phase === "hunter-window"
          ? "red"
          : phase === "refund-unlocked"
            ? "lime"
            : "yellow";

  const phaseMessage =
    phase === "pre-expiry"
      ? "Floor must hold until expiry."
      : phase === "hunter-window"
        ? "Post-expiry slash window — any hunter can still slash."
        : phase === "refund-unlocked"
          ? "Creator can claim refund now."
          : phase === "slashed"
            ? "Bond has been slashed on-chain."
            : "Bond refunded to creator.";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="label-mono">{targetLabel}</div>
        <div className="mt-2 flex items-baseline gap-3">
          <div className="giant giant--hero text-white tabular-nums">{countdownValue}</div>
        </div>
        <div className="mt-3 inline-flex items-center gap-2">
          <span className={`live-dot live-dot--${dotVariant}`} />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
            {phaseMessage}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-[var(--border)] pt-5">
        <TimeRow label="Expires at" value={formatDateTime(expiresAtMs)} mono={false} />
        <TimeRow label="Expires (UTC)" value={`${formatUtc(expiresAtMs)} UTC`} mono />
        <TimeRow label="Refund unlocks" value={formatDateTime(refundUnlockMs)} mono={false} />
        <TimeRow label="Refund (UTC)" value={`${formatUtc(refundUnlockMs)} UTC`} mono />
        <TimeRow label="Timezone" value={timeZone} mono />
      </div>
    </div>
  );
}

function TimeRow({ label, value, mono }: { label: string; value: string; mono: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="label-mono">{label}</span>
      <span className={`text-right text-xs ${mono ? "font-mono text-white/85" : "text-white/90"}`}>
        {value}
      </span>
    </div>
  );
}
