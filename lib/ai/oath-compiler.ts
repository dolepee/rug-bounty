import type { ClassifiedPromise } from "@/lib/ai/classifier";
import { classifyPromisesWithFallback } from "@/lib/ai/dgrid";

export function parseHumanTokenAmount(input: string, decimals: number): bigint | null {
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

export function parseDurationSeconds(input: string): number | null {
  const minuteWords = input.match(/(\d+)\s*(?:min(?:ute)?s?)\b/i);
  if (minuteWords) return Number(minuteWords[1]) * 60;
  const minuteShorthand = input.match(/(\d+)\s*m\b/);
  if (minuteShorthand) return Number(minuteShorthand[1]) * 60;
  const hours = input.match(/(\d+)\s*h(?:ours?)?\b/i);
  if (hours) return Number(hours[1]) * 3600;
  const days = input.match(/(\d+)\s*d(?:ays?)?\b/i);
  if (days) return Number(days[1]) * 86400;
  return null;
}

function formatDuration(seconds: number) {
  if (seconds % 86400 === 0) return `${seconds / 86400}d`;
  if (seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
}

export function selectPrimaryEnforceablePromise(classified: ClassifiedPromise[]) {
  return classified.find((item) => item.class === "enforceable") ?? null;
}

export function compileCreatorWalletFloorRuleFromPromise(input: string, decimals: number) {
  const amount = parseHumanTokenAmount(input, decimals);
  if (!amount) {
    return null;
  }

  return {
    type: "CREATOR_WALLET_FLOOR" as const,
    declaredRetainedBalance: amount.toString(),
    expiresInSeconds: parseDurationSeconds(input) ?? 86400,
  };
}

export type CompiledOath = {
  provider: "dgrid" | "deterministic";
  model: string | null;
  classified: ClassifiedPromise[];
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

export async function compileOath(input: string, decimals = 18): Promise<CompiledOath> {
  const { provider, model, classified } = await classifyPromisesWithFallback(input);
  const enforceable = classified.filter((item) => item.class === "enforceable");
  const selectedPromise = selectPrimaryEnforceablePromise(classified);
  const rule = selectedPromise ? compileCreatorWalletFloorRuleFromPromise(selectedPromise.text, decimals) : null;
  const compileWarnings: string[] = [];

  if (enforceable.length > 1 && selectedPromise) {
    compileWarnings.push(`Multiple enforceable promises were detected. The bond compiler used only the first enforceable segment: "${selectedPromise.text}"`);
  }

  if (selectedPromise && !rule) {
    compileWarnings.push("An enforceable segment was detected, but the compiler could not extract a numeric retained-balance floor from that exact segment.");
  }

  return {
    provider,
    model,
    classified,
    enforceableCount: enforceable.length,
    selectedPromiseText: selectedPromise?.text ?? null,
    compileWarnings,
    humanSummary: rule
      ? `Creator wallet balance must stay at or above ${rule.declaredRetainedBalance} raw units for ${formatDuration(rule.expiresInSeconds)}. Compiled from: "${selectedPromise?.text}"`
      : "No enforceable bonded rule could be compiled from the current oath text.",
    rule,
  };
}
