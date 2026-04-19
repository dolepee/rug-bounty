import { NextResponse } from "next/server";
import { getHunterFeed } from "@/lib/data/store";

export async function GET() {
  return NextResponse.json({ entries: getHunterFeed() });
}
