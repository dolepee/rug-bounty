import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyPromisesWithFallback } from "@/lib/ai/dgrid";

const schema = z.object({
  text: z.string().min(1),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  return NextResponse.json(await classifyPromisesWithFallback(body.text));
}
