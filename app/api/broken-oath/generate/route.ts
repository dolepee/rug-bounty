import { NextResponse } from "next/server";
import { z } from "zod";
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
  const body = schema.parse(await request.json());
  return NextResponse.json(await generateBrokenOathPostWithFallback(body));
}
