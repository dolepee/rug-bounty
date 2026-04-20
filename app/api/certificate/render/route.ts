import { NextResponse } from "next/server";
import { z } from "zod";
import { getBondForPage } from "@/lib/data/showcase";

export const dynamic = "force-dynamic";

const rawPayloadSchema = z.object({
  ticker: z.string().min(1),
  tokenName: z.string().min(1).optional(),
  bondAmountBnb: z.number().nonnegative(),
  declaredFloor: z.string().min(1),
  status: z.string().min(1),
  expiresAtIso: z.string().min(1).optional(),
});

type CertificateCardPayload = {
  ticker: string;
  tokenName: string;
  bondAmountBnb: string;
  declaredFloor: string;
  status: string;
  expiresAtLabel: string;
};

function buildSvg(payload: CertificateCardPayload) {
  const safe = {
    ticker: escapeXml(payload.ticker),
    tokenName: escapeXml(payload.tokenName),
    bondAmountBnb: escapeXml(payload.bondAmountBnb),
    declaredFloor: escapeXml(payload.declaredFloor),
    status: escapeXml(payload.status),
    expiresAtLabel: escapeXml(payload.expiresAtLabel),
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B1018"/>
      <stop offset="1" stop-color="#101928"/>
    </linearGradient>
    <linearGradient id="amber" x1="140" y1="76" x2="1020" y2="560" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F59E0B" stop-opacity="0.52"/>
      <stop offset="1" stop-color="#D97706" stop-opacity="0.12"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" rx="36" fill="url(#panel)"/>
  <rect x="28" y="28" width="1144" height="574" rx="28" stroke="rgba(245,158,11,0.16)" stroke-width="1.5"/>
  <rect x="76" y="76" width="1048" height="478" rx="28" fill="rgba(255,255,255,0.028)" stroke="rgba(255,255,255,0.08)" stroke-width="1.2"/>
  <path d="M100 470C220 388 312 351 449 355C548 358 595 397 692 396C835 394 935 326 1098 174" stroke="url(#amber)" stroke-width="2"/>
  <path d="M94 504C256 402 330 407 463 416C560 423 636 481 761 474C905 466 1004 354 1098 254" stroke="url(#amber)" stroke-width="1.4" opacity="0.7"/>
  <text x="112" y="132" fill="#71717A" font-size="22" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" letter-spacing="4">RUGBOUNTY • BONDED LAUNCH CERTIFICATE</text>
  <text x="112" y="228" fill="#F4F4F5" font-size="78" font-weight="700" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${safe.ticker}</text>
  <text x="112" y="274" fill="#A1A1AA" font-size="28" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${safe.tokenName}</text>
  <text x="112" y="352" fill="#D4D4D8" font-size="28" font-family="Inter, ui-sans-serif, system-ui, sans-serif">Public promise backed by real BNB on BNB Chain.</text>
  <text x="112" y="464" fill="#71717A" font-size="22" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" letter-spacing="3">BOND</text>
  <text x="112" y="504" fill="#F59E0B" font-size="42" font-weight="700" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${safe.bondAmountBnb} BNB</text>
  <text x="400" y="464" fill="#71717A" font-size="22" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" letter-spacing="3">DECLARED FLOOR</text>
  <text x="400" y="504" fill="#F4F4F5" font-size="38" font-weight="600" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${safe.declaredFloor}</text>
  <text x="842" y="168" fill="#71717A" font-size="22" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" letter-spacing="3">STATUS</text>
  <text x="842" y="210" fill="#F4F4F5" font-size="36" font-weight="700" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${safe.status}</text>
  <text x="842" y="284" fill="#71717A" font-size="22" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" letter-spacing="3">EXPIRY</text>
  <text x="842" y="326" fill="#E4E4E7" font-size="26" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${safe.expiresAtLabel}</text>
  <text x="842" y="438" fill="#D4D4D8" font-size="26" font-family="Inter, ui-sans-serif, system-ui, sans-serif">This does not detect every rug.</text>
  <text x="842" y="476" fill="#D4D4D8" font-size="26" font-family="Inter, ui-sans-serif, system-ui, sans-serif">It enforces one public promise with money attached.</text>
</svg>`;
}

function escapeXml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toPayloadFromRaw(body: z.infer<typeof rawPayloadSchema>): CertificateCardPayload {
  return {
    ticker: body.ticker,
    tokenName: body.tokenName || body.ticker,
    bondAmountBnb: body.bondAmountBnb.toFixed(4),
    declaredFloor: body.declaredFloor,
    status: body.status,
    expiresAtLabel: body.expiresAtIso ? new Date(body.expiresAtIso).toLocaleString("en-GB", { hour12: false }) : "open",
  };
}

async function getPayloadForId(id: string): Promise<CertificateCardPayload | null> {
  const bond = await getBondForPage(id);
  if (!bond) {
    return null;
  }

  return {
    ticker: bond.ticker,
    tokenName: bond.tokenName,
    bondAmountBnb: Number(bond.bondAmountBnb).toFixed(4),
    declaredFloor: bond.declaredFloor,
    status: bond.status,
    expiresAtLabel: new Date(bond.expiresAtIso).toLocaleString("en-GB", { hour12: false }),
  };
}

function imageResponse(svg: string) {
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing certificate id." }, { status: 400 });
  }

  const payload = await getPayloadForId(id);
  if (!payload) {
    return NextResponse.json({ error: "Bond not found." }, { status: 404 });
  }

  return imageResponse(buildSvg(payload));
}

export async function POST(request: Request) {
  const body = await request.json();
  const id = typeof body?.id === "string" ? body.id : undefined;

  const payload = id ? await getPayloadForId(id) : toPayloadFromRaw(rawPayloadSchema.parse(body));
  if (!payload) {
    return NextResponse.json({ error: "Bond not found." }, { status: 404 });
  }

  return imageResponse(buildSvg(payload));
}
