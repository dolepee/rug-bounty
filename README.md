# RugBounty

RugBounty is a bond-backed accountability layer for Four.Meme launches on BNB Chain.

Creators put BNB behind one public promise about their own bag. If their declared creator-wallet balance drops below a public floor before expiry, any hunter can call the vault and take the bond. An autonomous Rug Hunter Agent watches active bonds and submits `resolveBond` when the floor breaks.

Formal positioning: `Bonded Launches for Four.Meme`

Campaign line: `Pay me if I rug.`

## Proof model

Vault-enforced:
- `CREATOR_WALLET_FLOOR` slash / refund logic
- declared wallets, retained floor, expiry, bond amount

App-verified:
- Four.Meme `TokenCreate` parsing from a submitted launch tx hash
- launch metadata display and proof links

AI-assisted:
- promise classification
- rule compilation
- narrative explanations

When configured, the AI layer uses DGrid's OpenAI-compatible gateway first and falls back to deterministic local logic if the provider is unavailable.

Not claimed:
- full rug detection
- hidden-wallet detection
- on-chain verification of historical Four.Meme launch events

## Live proof

The current showcase proof is a real BNB mainnet loop around `PatchProof / PATCH` on the **patched vault**:

- Four.Meme launch tx:
  `0xdeafcf1faf1afd130f75941aa48ea8d7d9a6bc074cf17cfd7293030aa5d7eea4`
- BondCreated tx:
  `0xc642798f5dbf33f6d59b97229fe4f505fa555498121f8329b751a37323ec3f64`
- BondSlashed tx:
  `0x7ce760c03a4d7a0c4c9ce015402572f13410f8b1b747b57f53142a78910a6534`

What happened:
- the creator launched `PATCH` on Four.Meme
- the creator bonded a `1.02M PATCH` retained-balance floor with `0.006 BNB`
- the creator sold below the floor
- the Rug Hunter Agent submitted the slash onchain

Configured vault:
- `0xd8654b6b4f0fc382f36341ac7fd6c70466950fd5`

Archived earlier proof:
- `BIBI` remains a historical first-pass mainnet proof on the old vault, but the current public showcase and submission narrative are anchored to the patched `PATCH` loop above.

## Current state

Implemented:
- Next.js 16 app
- `RugBountyVault.sol`
- Four.Meme TokenManager2 launch parsing
- DGrid-backed oath classification / compilation with deterministic fallback
- browser-wallet `createBond` flow on `/create`
- manual `resolveBond` and `refundAfterExpiry` actions on the live bond page
- live bond detail / certificate / broken-oaths proof surfaces
- real certificate share-card render route at `/api/certificate/render`
- public APIs aligned to the live showcase proof instead of mock rows
- Rug Hunter Agent watcher and slash path
- PM2 runtime config for persistent hunter deployment
- minimal HTTP skill wrapper under `skills/rugbounty` and `/api/skill/*`
- Ganache-backed contract tests for create / slash / refund / revert paths
- real mainnet proof loop for launch -> bond -> breach -> slash

Currently proven on mainnet:
- one real slashed bond on the patched vault (`PATCH`)
- one earlier slashed bond on the previous vault (`BIBI`)

Currently proven locally and exposed in-product:
- clean refund path via `refundAfterExpiry`
- manual hunter path via `resolveBond`

Not claimed:
- a second real clean-refund bond already executed on mainnet

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run compile:contract
npm run wallets:generate
npm run agent:dev
npm run deploy
```

## Environment

```bash
BSC_RPC_URL=
BSC_WS_RPC_URL=
NEXT_PUBLIC_BSC_RPC_URL=
PRIVATE_KEY=
RUG_BOUNTY_VAULT_ADDRESS=
RUG_BOUNTY_START_BLOCK=
NEXT_PUBLIC_RUG_BOUNTY_VAULT_ADDRESS=
DGRID_API_KEY=
DGRID_BASE_URL=https://api.dgrid.ai/v1
DGRID_MODEL=openai/gpt-4o
RUG_HUNTER_FEED_PATH=
```

## Hunter deployment

Local:

```bash
npm run agent:dev
```

Persistent:

```bash
pm2 start ecosystem.config.cjs --only rug-hunter
```

## Skill wrapper

Minimal agent-facing commands are exposed at:

- `GET /api/skill/manifest`
- `POST /api/skill/parse-launch`
- `POST /api/skill/compile-oath`
- `POST /api/skill/create-bond-payload`
- `GET /api/skill/watch-bond/:id`

The bundled manifest is in [skills/rugbounty/manifest.json](/home/qdee/rug-bounty/skills/rugbounty/manifest.json).

## Demo flow

1. Parse a real Four.Meme launch tx on `/create`
2. Compile a public promise into one bondable rule
3. Create the bond from the creator wallet
4. Breach the retained-balance floor
5. Let the Rug Hunter Agent call `resolveBond`
6. Open BscScan proof, the manual action surface, and the certificate share card
