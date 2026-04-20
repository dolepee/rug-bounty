import { NextResponse } from "next/server";
import { z } from "zod";
import { parseTokenCreateFromTxHash } from "@/lib/fourmeme/token-create-events";

const schema = z.object({
  txHash: z.string().min(1),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  try {
    const parsed = await parseTokenCreateFromTxHash(body.txHash as `0x${string}`);
    return NextResponse.json({ parsed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not parse TokenCreate from this launch tx." },
      { status: 400 },
    );
  }
}
