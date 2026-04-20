import type { ClassifiedPromise } from "@/lib/ai/classifier";
import { classifyPromisesWithFallback } from "@/lib/ai/dgrid";

function parseHumanTokenAmount(input: string, decimals: number): bigint | null {
  const match = input.match(/(\d+(?:\.\d+)?)\s*([kmb])?/i);
  if (!match) return null;
  const numeric = match[1];
  const suffix = (match[2] || "").toLowerCase();
  const multiplier = suffix === "b" ? 1_000_000_000n : suffix === "m" ? 1_000_000n : suffix === "k" ? 1_000n : 1n;
  const [wholePart, fractionalPart = ""] = numeric.split(".");
  const precision = BigInt(fractionalPart.length);
  const whole = BigInt(wholePart || "0");
  const fractional = BigInt(fractionalPart || "0");
  const scaledBase = whole * 10n ** precision + fractional;
  return (scaledBase * multiplier * 10n ** BigInt(decimals)) / 10n ** precision;
}

function parseDurationSeconds(input: string): number | null {
  const minutes = input.match(/(\d+)\s*m(?:in(?:ute)?s?)?/i);
  if (minutes) return Number(minutes[1]) * 60;
  const hours = input.match(/(\d+)\s*h(?:ours?)?/i);
  if (hours) return Number(hours[1]) * 3600;
  const days = input.match(/(\d+)\s*d(?:ays?)?/i);
  if (days) return Number(days[1]) * 86400;
  return null;
}

function formatDuration(seconds: number) {
  if (seconds % 86400 === 0) return `${seconds / 86400}d`;
  if (seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
}

export type CompiledOath = {
  provider: "dgrid" | "deterministic";
  model: string | null;
  classified: ClassifiedPromise[];
  enforceableCount: number;
  humanSummary: string;
  rule: {
    type: "CREATOR_WALLET_FLOOR";
    declaredRetainedBalance: string;
    expiresInSeconds: number;
  } | null;
};

export async function compileOath(input: string, decimals = 18): Promise<CompiledOath> {
  const { provider, model, classified } = await classifyPromisesWithFallback(input);
  const enforceable = classified.filter((item) => item.class === "enforceable");

  const amount = parseHumanTokenAmount(input, decimals);
  const duration = parseDurationSeconds(input) ?? 86400;

  const rule =
    enforceable.length > 0 && amount
      ? {
          type: "CREATOR_WALLET_FLOOR" as const,
          declaredRetainedBalance: amount.toString(),
          expiresInSeconds: duration,
        }
      : null;

  return {
    provider,
    model,
    classified,
    enforceableCount: enforceable.length,
    humanSummary: rule
      ? `Creator wallet balance must stay at or above ${rule.declaredRetainedBalance} raw units for ${formatDuration(rule.expiresInSeconds)}.`
      : "No enforceable bonded rule could be compiled from the current oath text.",
    rule,
  };
}
