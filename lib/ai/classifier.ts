export type PromiseClass = "enforceable" | "needs_social_proof" | "not_enforceable";

export type ClassifiedPromise = {
  text: string;
  class: PromiseClass;
  reason: string;
  suggestedRewrite?: string;
};

const ENFORCEABLE_PATTERNS = [
  /hold at least/i,
  /hold .* for \d+/i,
  /retain .* tokens/i,
  /not sell/i,
  /not move/i,
];

const SOCIAL_PATTERNS = [
  /daily update/i,
  /post/i,
  /community/i,
  /tweet/i,
  /telegram/i,
];

const NOT_ENFORCEABLE_PATTERNS = [
  /partnership/i,
  /binance/i,
  /100x/i,
  /guaranteed/i,
  /listing/i,
  /coinbase/i,
];

export function splitPromiseText(input: string): string[] {
  return input
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z])/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function classifyPromises(input: string): ClassifiedPromise[] {
  return splitPromiseText(input).map((text) => {
    if (NOT_ENFORCEABLE_PATTERNS.some((pattern) => pattern.test(text))) {
      return {
        text,
        class: "not_enforceable",
        reason: "No on-chain signal can prove this claim. Remove it or rewrite it as a wallet-balance promise.",
        suggestedRewrite: "I will hold at least X tokens in my declared creator wallet for Y hours.",
      } satisfies ClassifiedPromise;
    }

    if (SOCIAL_PATTERNS.some((pattern) => pattern.test(text))) {
      return {
        text,
        class: "needs_social_proof",
        reason: "This is socially observable but not vault-enforceable. Keep it visible, but do not bond it.",
        suggestedRewrite: "Separate this from the bonded oath. Keep only enforceable wallet-floor promises in the bond.",
      } satisfies ClassifiedPromise;
    }

    if (ENFORCEABLE_PATTERNS.some((pattern) => pattern.test(text))) {
      return {
        text,
        class: "enforceable",
        reason: "This can map to a declared-wallet floor check using on-chain balance reads.",
      } satisfies ClassifiedPromise;
    }

    return {
      text,
      class: "needs_social_proof",
      reason: "Unclear promises default to social proof unless they map cleanly to a wallet-floor rule.",
      suggestedRewrite: "State the minimum token balance, the declared wallet, and the time window explicitly.",
    } satisfies ClassifiedPromise;
  });
}
