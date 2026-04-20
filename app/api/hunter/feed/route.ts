import { NextResponse } from "next/server";
import { readHunterFeed } from "@/lib/data/hunter-feed";

export async function GET() {
  return NextResponse.json({ entries: await readHunterFeed() });
}
