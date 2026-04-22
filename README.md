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
- no current-vault public funded proof has been published yet

## Legacy proof archive

Archived proof vault:
- `0xe010a3457001a0a8a6f2e69cdc962e705dbdedea`

Slash proof, `FinalSlash / FSLH`:
- Four.Meme launch tx: `0x9dffb11791807de1d0ef3ebd81a5df68bb6fab9fdaad1118615d42b11ab0c1b9`
- BondCreated tx: `0x9a124548380e3b37efbe9b6fb6f6b34f4b78c496d1709ad1b3aaf00eda3a09a2`
- BondBreachFlagged tx: `0x35eb0ec84eaf121d454a0b68abc7b7994121f466975505c901ec645fb15f762a`
- BondSlashed tx: `0x6d039369733eaca6d8d9475603449f723c58471577af0efca69565e9e50fed59`

Refund proof, `FinalRefund / FRFD`:
- Four.Meme launch tx: `0xaaf8cd23968cdcab641e522b0b09c771a660940bdae46e514a2bca9f06da25b4`
- BondCreated tx: `0x4fa2340dbe8fb66e0af83053d596354efd805b5594483356aa044435a1b8af28`
- BondRefunded tx: `0x18c2cc2b0205c21dc304ae2872a9bb6ce9b3aad54ecce765d27efe11d331103f`

What happened:
- `FSLH` was launched on Four.Meme, bonded with a `1.05M FSLH` retained-balance floor and `0.003 BNB`, then sold below floor
- the Rug Hunter Agent flagged the breach onchain, and a third-party hunter won the permissionless slash race
- `FRFD` was launched on Four.Meme, bonded with a `1.05M FRFD` retained-balance floor and `0.005 BNB`, held above floor through expiry plus grace window, then refunded

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
- active vault is live and ready for fresh funded tests
- legacy archive contains one real slashed bond (`FSLH`) and one real refunded bond (`FRFD`)

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
