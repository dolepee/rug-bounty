import { NextResponse } from "next/server";
import { z } from "zod";
import { compileOath } from "@/lib/ai/oath-compiler";

const schema = z.object({
  text: z.string().min(1),
  tokenDecimals: z.number().int().min(0).max(36).optional(),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  return NextResponse.json(await compileOath(body.text, body.tokenDecimals ?? 18));
}
