import { NextResponse } from "next/server";
import { getAllBonds } from "@/lib/data/store";

export async function GET() {
  return NextResponse.json({ bonds: getAllBonds() });
}
