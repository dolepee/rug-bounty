import { NextResponse } from "next/server";
import { getDirectoryBonds } from "@/lib/data/showcase";

export async function GET() {
  return NextResponse.json({ bonds: await getDirectoryBonds() });
}
