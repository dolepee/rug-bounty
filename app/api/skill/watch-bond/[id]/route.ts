import { NextResponse } from "next/server";
import { getBondForPage } from "@/lib/data/showcase";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bond = await getBondForPage(id);
  if (!bond) {
    return NextResponse.json({ error: "Bond not found." }, { status: 404 });
  }

  const expiresAt = new Date(bond.expiresAtIso).getTime();
  const now = Date.now();
  const nextAction =
    bond.status === "SLASHED" || bond.status === "REFUNDED"
      ? "none"
      : now >= expiresAt
        ? "refundAfterExpiry"
        : bond.status === "AT_RISK"
          ? "resolveBond"
          : "hold";

  return NextResponse.json({
    bond,
    nextAction,
    explanation:
      nextAction === "resolveBond"
        ? "Declared creator balance is below floor pre-expiry. Any hunter can attempt resolveBond."
        : nextAction === "refundAfterExpiry"
          ? "Bond is past expiry and still active. Creator can claim refundAfterExpiry."
          : nextAction === "hold"
            ? "Bond is active and above floor."
            : "Bond is already terminal.",
  });
}
