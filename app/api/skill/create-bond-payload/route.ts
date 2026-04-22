import { NextResponse } from "next/server";
import { getAddress, isAddress, keccak256, parseEther, stringToHex, type Address, type Hex } from "viem";
import { z } from "zod";
import { parseTokenCreateFromTxHash } from "@/lib/fourmeme/token-create-events";
import { rugBountyVaultAbi } from "@/lib/chain/rug-bounty";

const minBondWei = parseEther("0.003");

const schema = z.object({
  launchTxHash: z.string().startsWith("0x"),
  token: z.string().refine((value) => isAddress(value), "Invalid token address.").optional(),
  creator: z.string().refine((value) => isAddress(value), "Invalid creator address.").optional(),
  launchTimestamp: z.coerce.number().int().positive().optional(),
  declaredCreatorWallets: z.array(z.string()).min(1),
  oathText: z.string().min(1),
  declaredRetainedBalance: z.string().min(1),
  expiresInSeconds: z.coerce.number().int().positive(),
  bondAmountBnb: z.string().min(1),
});

export async function buildCreateBondPayload(body: z.infer<typeof schema>, parser = parseTokenCreateFromTxHash) {
  const declaredCreatorWallets = body.declaredCreatorWallets.map((wallet) => {
    if (!isAddress(wallet)) {
      throw new Error(`Invalid declared wallet: ${wallet}`);
    }
    return getAddress(wallet);
  });
  if (new Set(declaredCreatorWallets).size !== declaredCreatorWallets.length) {
    throw new Error("Declared creator wallets must be unique.");
  }
  const parsed = await parser(body.launchTxHash as Hex);

  if (body.token && getAddress(body.token) !== getAddress(parsed.token)) {
    throw new Error("Submitted token address does not match the real Four.Meme TokenCreate event.");
  }
  if (body.creator && getAddress(body.creator) !== getAddress(parsed.creator)) {
    throw new Error("Submitted creator address does not match the real Four.Meme TokenCreate event.");
  }
  if (body.launchTimestamp && BigInt(body.launchTimestamp) !== parsed.launchTime) {
    throw new Error("Submitted launch timestamp does not match the real Four.Meme TokenCreate event.");
  }
  if (!declaredCreatorWallets.includes(getAddress(parsed.creator))) {
    throw new Error("Declared creator wallets must include the creator wallet from the real Four.Meme launch.");
  }

  const oathHash = keccak256(stringToHex(body.oathText));
  const rulesHash = keccak256(
    stringToHex(
      JSON.stringify({
        type: "CREATOR_WALLET_FLOOR",
        declaredRetainedBalance: body.declaredRetainedBalance,
        expiresInSeconds: body.expiresInSeconds,
        declaredCreatorWallets,
      }),
    ),
  );

  const launchTimestamp = parsed.launchTime;
  const expiresAt = launchTimestamp + BigInt(body.expiresInSeconds);
  const bondAmountWei = parseEther(body.bondAmountBnb);

  if (bondAmountWei < minBondWei) {
    throw new Error("Bond amount is below the current vault minimum.");
  }

  return {
    contract: {
      abi: rugBountyVaultAbi,
      functionName: "createBond",
      args: [
        getAddress(parsed.token) as Address,
        body.launchTxHash as Hex,
        launchTimestamp.toString(),
        declaredCreatorWallets,
        body.declaredRetainedBalance,
        body.oathText,
        rulesHash,
        expiresAt.toString(),
      ],
      valueWei: bondAmountWei.toString(),
    },
    proof: {
      creator: getAddress(parsed.creator),
      declaredCreatorWallets,
      ruleType: "CREATOR_WALLET_FLOOR",
      oathHash,
      rulesHash,
      launchProof: {
        token: getAddress(parsed.token),
        creator: getAddress(parsed.creator),
        launchTimestamp: parsed.launchTime.toString(),
        requestId: parsed.requestId.toString(),
      },
    },
  };
}

export async function POST(request: Request) {
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

  try {
    return NextResponse.json(await buildCreateBondPayload(parsed.data));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not build a Four.Meme-bonded createBond payload." },
      { status: 400 },
    );
  }
}
