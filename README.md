# RugBounty

RugBounty is a bond-backed accountability layer for Four.Meme launches on BNB Chain.

Creators lock BNB behind one public promise about a declared wallet set. If that declared balance drops below a public floor before expiry, any hunter can call the vault and take the bond. A live Rug Hunter Agent watches active bonds, flags breaches onchain, and monitors the permissionless slash path.

Positioning: `Bonded Launches for Four.Meme`

## Proof model

Vault-enforced:
- `CREATOR_WALLET_FLOOR` slash / refund logic
- declared wallets, retained floor, expiry, bond amount, slash window

App-verified:
- Four.Meme `TokenCreate` parsing from a submitted launch tx hash
- launch metadata display and proof links

AI-assisted:
- promise classification
- rule compilation
- explanatory copy around enforceable vs social-only claims

When configured, the AI layer uses DGrid's OpenAI-compatible gateway first and falls back to deterministic local logic if the provider is unavailable.

Not claimed:
- full rug detection
- hidden-wallet detection
- onchain proof of Four.Meme provenance inside the vault itself; the official flow verifies real Four.Meme launches before bond creation
- proof that every declared wallet is creator-controlled; the vault proves `msg.sender` is included, then monitors the declared wallet set

## Active vault

Current funded system:
- `0x8456e375259faab451c6906ba8ac22b1cd8ae1c8`
- 20% protocol leg routes to the burn address `0x000000000000000000000000000000000000dEaD`
- duplicate declared wallets are rejected onchain

Current public proof chain on the active vault:

Slash proof, `BurnSlash / BSLH`:
- Four.Meme launch tx: `0x6010645001bc09ed03acf1d6d7491de2c08a95a2dea6c82cb2c10b0edfe88393`
- BondCreated tx: `0x51da87a3ec3a08a752b65cdd10877c3d7bbd3a090ac89ba52d0aae176f5288a9`
- BondBreachFlagged tx: `0xffab0e03fd7e9ed3a2591598b91feacf66573464f76f0abdc71ca5fd97d72afd`
- BondSlashed tx: `0x766e68b07d852cb155ff23db1c35ab6cf88a8cea8d8ee4a1124c64cef929379f`

Refund proof, `BurnReturn / BRTN`:
- Four.Meme launch tx: `0x81ec07789a937f63a9c54e77e43fe7d4d421e26c2bbc807a81a42ed5cabfb05b`
- BondCreated tx: `0x5c8ea971109c72b5b500f77116673afd1ca1fa9a5ca4f2569bc6aa8c0657af4c`
- BondRefunded tx: `0x395b99e567219b2aa300eaa6a10b716bec70916782a59de36c37623da4b02eb5`

What happened:
- `BSLH` was launched on Four.Meme, bonded with a `1.05M BSLH` retained-balance floor and `0.003 BNB`, then sold below floor
- the breach was flagged onchain and the slash settled on the burn-address vault; 80% paid the hunter and 20% burned
- `BRTN` was launched on Four.Meme, bonded with a `1.05M BRTN` retained-balance floor and `0.005 BNB`, held above floor through expiry plus grace window, then refunded

## Legacy proof archive

Archived proof vault:
- `0xe010a3457001a0a8a6f2e69cdc962e705dbdedea`

- prior public proof set:
  - `FinalSlash / FSLH`
  - `FinalRefund / FRFD`
- those receipts remain public for inspection, but they are no longer the active funded path

Budget note:
- these proof bonds were intentionally kept small so the full mainnet loop could be cycled repeatedly under hackathon budget
- the primitive itself is not tied to small bond sizes

Archived earlier proof:
- older rehearsal loops (`PATCH`, `SEAL`, `BIBI`) remain real onchain history alongside the archived `FSLH/FRFD` proof set above

## Product surface

Included in this repo:
- Next.js 16 app
- `RugBountyVault.sol`
- Four.Meme TokenManager2 launch parsing
- DGrid-backed oath classification / compilation with deterministic fallback
- browser-wallet `createBond` flow on `/create`, gated behind a successful real Four.Meme parse
- creator-balance / minimum-floor / recommended-floor guidance on `/create`
- proof detail, certificate, and broken-oaths surfaces
- public hunter status route at `/api/hunter/status`
- PM2 runtime config for persistent hunter deployment
- minimal HTTP skill wrapper under `skills/rugbounty` and `/api/skill/*`
- Ganache-backed contract tests for create / slash / refund / revert paths

Mainnet state:
- active vault is live and already has one real slashed bond (`BSLH`) and one real refunded bond (`BRTN`)
- legacy archive contains earlier public proof receipts from the previous vault

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run compile:contract
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
RUG_HUNTER_STATUS_URL=
DGRID_API_KEY=
DGRID_BASE_URL=https://api.dgrid.ai/v1
DGRID_MODEL=openai/gpt-5-mini
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

Manifest:
- [skills/rugbounty/manifest.json](/home/qdee/rug-bounty/skills/rugbounty/manifest.json)
