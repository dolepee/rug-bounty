import { NextResponse } from "next/server";
import { getBrokenOaths } from "@/lib/data/store";

export async function GET() {
  return NextResponse.json({ brokenOaths: getBrokenOaths() });
}
