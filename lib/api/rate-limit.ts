type Bucket = {
  tokens: number;
  updatedAt: number;
};

type BucketStore = Map<string, Bucket>;

declare global {
  var __rugBountyRateLimitStore: BucketStore | undefined;
}

const store = globalThis.__rugBountyRateLimitStore ?? (globalThis.__rugBountyRateLimitStore = new Map());

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstHop] = forwardedFor.split(",");
    if (firstHop?.trim()) {
      return firstHop.trim();
    }
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("fly-client-ip") ||
    "unknown"
  );
}

export function takeRateLimitToken(
  request: Request,
  key: string,
  {
    capacity,
    refillWindowMs,
  }: {
    capacity: number;
    refillWindowMs: number;
  },
) {
  const clientIp = getClientIp(request);
  const bucketKey = `${key}:${clientIp}`;
  const now = Date.now();
  const existing = store.get(bucketKey) ?? { tokens: capacity, updatedAt: now };
  const elapsed = Math.max(0, now - existing.updatedAt);
  const refillRatePerMs = capacity / refillWindowMs;
  const replenishedTokens = Math.min(capacity, existing.tokens + elapsed * refillRatePerMs);

  if (replenishedTokens < 1) {
    store.set(bucketKey, { tokens: replenishedTokens, updatedAt: now });
    const retryAfterMs = Math.ceil((1 - replenishedTokens) / refillRatePerMs);
    return {
      ok: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  store.set(bucketKey, {
    tokens: replenishedTokens - 1,
    updatedAt: now,
  });

  return {
    ok: true as const,
    retryAfterSeconds: 0,
  };
}
