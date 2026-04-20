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
    return "now";
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

export function BondTimePanel({ expiresAtIso, status }: BondTimePanelProps) {
  const [now, setNow] = useState(() => Date.now());
  const [timeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const expiresAtMs = useMemo(() => new Date(expiresAtIso).getTime(), [expiresAtIso]);
  const refundUnlockMs = expiresAtMs + postExpirySlashWindowMs;
  const phaseLabel =
    status === "SLASHED" || status === "REFUNDED"
      ? status.toLowerCase()
      : now < expiresAtMs
        ? "counting down to expiry"
        : now < refundUnlockMs
          ? "hunter grace window active"
          : "refund unlocked";

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Timing</div>
      <div className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Browser timezone</span>
          <span className="font-mono text-zinc-200">{timeZone}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Expires at</span>
          <span className="text-right text-zinc-200">{formatDateTime(expiresAtMs)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Expires at (UTC)</span>
          <span className="text-right font-mono text-zinc-300">{formatUtc(expiresAtMs)} UTC</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Refund unlocks at</span>
          <span className="text-right text-zinc-200">{formatDateTime(refundUnlockMs)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Refund unlocks (UTC)</span>
          <span className="text-right font-mono text-zinc-300">{formatUtc(refundUnlockMs)} UTC</span>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-100">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-200/80">Current phase</div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span>{phaseLabel}</span>
            <span className="font-mono">
              {now < expiresAtMs
                ? formatCountdown(expiresAtMs, now)
                : now < refundUnlockMs
                  ? formatCountdown(refundUnlockMs, now)
                  : "0m 0s"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
