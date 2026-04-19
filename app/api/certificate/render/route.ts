import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  ticker: z.string().min(1),
  bondAmountBnb: z.number().nonnegative(),
  declaredFloor: z.string().min(1),
  status: z.string().min(1),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  return NextResponse.json({
    title: `${body.ticker} • Bonded Launch Certificate`,
    subtitle: `${body.bondAmountBnb.toFixed(2)} BNB bonded • floor ${body.declaredFloor} • ${body.status}`,
    note: "Use this payload to render an og:image card in the next pass.",
  });
}
