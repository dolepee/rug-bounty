import { NextResponse } from "next/server";
import { z } from "zod";
import { compileOath } from "@/lib/ai/oath-compiler";

const schema = z.object({
  text: z.string().min(1),
  tokenDecimals: z.number().int().min(0).max(36).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  return NextResponse.json(await compileOath(parsed.data.text, parsed.data.tokenDecimals ?? 18));
}
