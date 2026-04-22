import { NextResponse } from "next/server";
import { getLegacyArchiveBonds } from "@/lib/data/showcase";
import { getConfiguredVaultAddress, getLiveVaultBonds } from "@/lib/data/live-bonds";

export async function GET() {
  const [currentVaultBonds, legacyArchive] = await Promise.all([getLiveVaultBonds(), getLegacyArchiveBonds()]);
  return NextResponse.json({
    currentVaultAddress: getConfiguredVaultAddress(),
    currentVaultBonds,
    legacyArchive,
    bonds: [...currentVaultBonds, ...legacyArchive],
  });
}
