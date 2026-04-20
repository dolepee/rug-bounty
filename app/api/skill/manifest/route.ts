import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "rugbounty",
    version: "0.1.0",
    description: "HTTP skill wrapper for Four.Meme launch accountability and bonded launch proof.",
    commands: [
      {
        name: "parse_launch",
        method: "POST",
        path: "/api/skill/parse-launch",
        description: "Parse a Four.Meme TokenCreate launch tx hash into token, creator, timestamp, and metadata.",
      },
      {
        name: "compile_oath",
        method: "POST",
        path: "/api/skill/compile-oath",
        description: "Classify launch promises and compile the enforceable CREATOR_WALLET_FLOOR rule.",
      },
      {
        name: "create_bond_payload",
        method: "POST",
        path: "/api/skill/create-bond-payload",
        description: "Prepare unsigned createBond calldata and human-readable proof data for an external agent or client.",
      },
      {
        name: "watch_bond",
        method: "GET",
        path: "/api/skill/watch-bond/:id",
        description: "Read live bond state and determine whether the next valid action is hold, slash, or refund.",
      },
    ],
  });
}
