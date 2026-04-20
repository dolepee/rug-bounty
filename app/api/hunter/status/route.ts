import { NextResponse } from "next/server";
import { getHunterRuntimeStatus } from "@/lib/data/hunter-status";

export async function GET() {
  return NextResponse.json({ status: await getHunterRuntimeStatus() });
}
