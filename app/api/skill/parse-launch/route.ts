import { NextResponse } from "next/server";
import { z } from "zod";
import { parseTokenCreateFromTxHash, type ParsedTokenCreate } from "@/lib/fourmeme/token-create-events";

const schema = z.object({
  txHash: z.string().min(1),
});

export function serializeParsedLaunch(parsed: ParsedTokenCreate) {
  return {
    ...parsed,
    requestId: parsed.requestId.toString(),
    totalSupply: parsed.totalSupply.toString(),
    launchTime: parsed.launchTime.toString(),
    launchFee: parsed.launchFee.toString(),
    blockNumber: parsed.blockNumber.toString(),
  };
}

export async function parseLaunchSkillRequest(txHash: string, parser = parseTokenCreateFromTxHash) {
  const parsed = await parser(txHash as `0x${string}`);
  return { parsed: serializeParsedLaunch(parsed) };
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsedBody = schema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
        issues: parsedBody.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await parseLaunchSkillRequest(parsedBody.data.txHash));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not parse TokenCreate from this launch tx." },
      { status: 400 },
    );
  }
}
