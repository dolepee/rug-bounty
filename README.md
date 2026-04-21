# RugBounty

RugBounty is a bond-backed accountability layer for Four.Meme launches on BNB Chain.

Creators put BNB behind one public promise about their own bag. If their declared creator-wallet balance drops below a public floor before expiry, any hunter can call the vault and take the bond. An autonomous Rug Hunter Agent watches active bonds, flags breaches onchain, and races permissionless slash transactions when the floor breaks.

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
- during the hackathon demo period, `PROTOCOL_TREASURY` is author-controlled; production deployments should point the 20% protocol leg at a burn, DAO, or multisig

## Live proof

The final-vault proof set has both mainnet outcomes:

Slash proof, `FinalSlash / FSLH`:

- Four.Meme launch tx:
  `0x9dffb11791807de1d0ef3ebd81a5df68bb6fab9fdaad1118615d42b11ab0c1b9`
- BondCreated tx:
  `0x9a124548380e3b37efbe9b6fb6f6b34f4b78c496d1709ad1b3aaf00eda3a09a2`
- BondBreachFlagged tx:
  `0x35eb0ec84eaf121d454a0b68abc7b7994121f466975505c901ec645fb15f762a`
- BondSlashed tx:
  `0x6d039369733eaca6d8d9475603449f723c58471577af0efca69565e9e50fed59`

Refund proof, `FinalRefund / FRFD`:

- Four.Meme launch tx:
  `0xaaf8cd23968cdcab641e522b0b09c771a660940bdae46e514a2bca9f06da25b4`
- BondCreated tx:
  `0x4fa2340dbe8fb66e0af83053d596354efd805b5594483356aa044435a1b8af28`
- BondRefunded tx:
  `0x18c2cc2b0205c21dc304ae2872a9bb6ce9b3aad54ecce765d27efe11d331103f`

What happened:
- the creator launched `FSLH` on Four.Meme, bonded a `1.05M FSLH` retained-balance floor with `0.003 BNB`, then sold below the floor
- the Rug Hunter Agent flagged the breach onchain, and a third-party hunter won the permissionless slash race on the final vault
- the creator launched `FRFD` on Four.Meme, bonded a `1.05M FRFD` retained-balance floor with `0.005 BNB`, kept the balance above floor through expiry plus the hunter grace window, then claimed the refund on the final vault

Configured vault:
- `0xe010a3457001a0a8a6f2e69cdc962e705dbdedea`

Budget note:
- these live proof bonds were intentionally kept small so the full mainnet loop could be cycled repeatedly under hackathon budget
- the primitive itself is not tied to small bond sizes

Archived earlier proof:
- older rehearsal loops (`PATCH`, `SEAL`, and `BIBI`) remain real onchain history, but the current public showcase and submission narrative are anchored to the final `FSLH/FRFD` vault above.

## Current state

Implemented:
- Next.js 16 app
- `RugBountyVault.sol`
- Four.Meme TokenManager2 launch parsing
- DGrid-backed oath classification / compilation with deterministic fallback
- browser-wallet `createBond` flow on `/create`
- creator-balance / minimum-floor / recommended-floor guidance on `/create`
- minute-based oath durations for faster refund-path demos
- manual `resolveBond` and `refundAfterExpiry` actions on the live bond page
- live bond detail / certificate / broken-oaths proof surfaces
- real certificate share-card render route at `/api/certificate/render`
- public APIs aligned to the live showcase proof instead of mock rows
- public hunter status route at `/api/hunter/status`
- Rug Hunter Agent watcher and slash path
- PM2 runtime config for persistent hunter deployment
- minimal HTTP skill wrapper under `skills/rugbounty` and `/api/skill/*`
- Ganache-backed contract tests for create / slash / refund / revert paths
- real mainnet proof loop for launch -> bond -> breach -> slash

Currently proven on mainnet:
- one real slashed bond on the final vault (`FSLH`)
- one real refunded bond on the final vault (`FRFD`)
- older archived proof loops on prior vault iterations (`PATCH`, `SEAL`, `BIBI`)

Currently proven locally and exposed in-product:
- manual hunter path via `resolveBond`

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
RUG_HUNTER_STATUS_URL=
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
5. Let the hunter path trigger: the Rug Hunter Agent flags the breach and any hunter can win the slash race
6. Open BscScan proof, the manual action surface, and the certificate share card
