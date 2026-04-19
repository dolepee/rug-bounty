import { NextResponse } from "next/server";
import { isHash, type Hex } from "viem";
import { parseTokenCreateFromTxHash } from "@/lib/fourmeme/token-create-events";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ txhash: string }> }) {
  const { txhash } = await params;
  if (!isHash(txhash)) {
    return NextResponse.json({ error: "Invalid transaction hash." }, { status: 400 });
  }

  try {
    const parsed = await parseTokenCreateFromTxHash(txhash as Hex);
    return NextResponse.json({
      proofModel: {
        vaultEnforced: false,
        appVerified: true,
        aiAssisted: false,
      },
      parsed: {
        ...parsed,
        requestId: parsed.requestId.toString(),
        totalSupply: parsed.totalSupply.toString(),
        launchTime: parsed.launchTime.toString(),
        launchFee: parsed.launchFee.toString(),
        blockNumber: parsed.blockNumber.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not parse TokenCreate from this launch tx." },
      { status: 404 },
    );
  }
}
