import { NextResponse } from "next/server";
import { getAddress, isAddress, keccak256, parseEther, stringToHex, type Address, type Hex } from "viem";
import { z } from "zod";
import { rugBountyVaultAbi } from "@/lib/chain/rug-bounty";

const minBondWei = parseEther("0.003");

const schema = z.object({
  token: z.string().refine((value) => isAddress(value), "Invalid token address."),
  creator: z.string().refine((value) => isAddress(value), "Invalid creator address."),
  launchTxHash: z.string().startsWith("0x"),
  launchTimestamp: z.coerce.number().int().positive(),
  declaredCreatorWallets: z.array(z.string()).min(1),
  oathText: z.string().min(1),
  declaredRetainedBalance: z.string().min(1),
  expiresInSeconds: z.coerce.number().int().positive(),
  bondAmountBnb: z.string().min(1),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const declaredCreatorWallets = body.declaredCreatorWallets.map((wallet) => {
    if (!isAddress(wallet)) {
      throw new Error(`Invalid declared wallet: ${wallet}`);
    }
    return getAddress(wallet);
  });

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

  const launchTimestamp = BigInt(body.launchTimestamp);
  const expiresAt = launchTimestamp + BigInt(body.expiresInSeconds);
  const bondAmountWei = parseEther(body.bondAmountBnb);

  if (bondAmountWei < minBondWei) {
    return NextResponse.json({ error: "Bond amount is below the current vault minimum." }, { status: 400 });
  }

  return NextResponse.json({
    contract: {
      abi: rugBountyVaultAbi,
      functionName: "createBond",
      args: [
        getAddress(body.token) as Address,
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
      creator: getAddress(body.creator),
      declaredCreatorWallets,
      ruleType: "CREATOR_WALLET_FLOOR",
      oathHash,
      rulesHash,
    },
  });
}
