import { NextResponse } from "next/server";
import { z } from "zod";
import { takeRateLimitToken } from "@/lib/api/rate-limit";
import { generateBrokenOathPostWithFallback } from "@/lib/ai/dgrid";

const schema = z.object({
  ticker: z.string().min(1),
  floor: z.string().min(1),
  currentBalance: z.string().min(1),
  hunter: z.string().min(1),
  bondAmount: z.string().min(1),
  txHash: z.string().min(1),
});

export async function POST(request: Request) {
  const rateLimit = takeRateLimitToken(request, "broken-oath-generate", {
    capacity: 4,
    refillWindowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  return NextResponse.json(await generateBrokenOathPostWithFallback(parsed.data));
}
