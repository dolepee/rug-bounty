import { NextResponse } from "next/server";
import { getBrokenOathBonds } from "@/lib/data/showcase";

export async function GET() {
  return NextResponse.json({ brokenOaths: await getBrokenOathBonds() });
}
