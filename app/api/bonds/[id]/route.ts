import { NextResponse } from "next/server";
import { getBondForPage } from "@/lib/data/showcase";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bond = await getBondForPage(id);
  if (!bond) {
    return NextResponse.json({ error: "Bond not found." }, { status: 404 });
  }

  return NextResponse.json({ bond });
}
