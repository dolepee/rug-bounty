import { NextResponse } from "next/server";
import { z } from "zod";
import { takeRateLimitToken } from "@/lib/api/rate-limit";
import { compileOath } from "@/lib/ai/oath-compiler";

const schema = z.object({
  text: z.string().min(1),
  tokenDecimals: z.number().int().min(0).max(36).optional(),
});

export async function POST(request: Request) {
  const rateLimit = takeRateLimitToken(request, "oath-compile", {
    capacity: 8,
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

  const body = schema.parse(await request.json());
  return NextResponse.json(await compileOath(body.text, body.tokenDecimals ?? 18));
}
