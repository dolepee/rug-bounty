# Rug Hunter Runtime

The live watcher entrypoint is:

- `agent/index.mjs`

It monitors `BondCreated` events from the configured vault, checks the live creator balance floor, and submits `resolveBond` when the floor is breached before expiry.

Required environment:

- `PRIVATE_KEY`
- `RUG_BOUNTY_VAULT_ADDRESS`
- `RUG_BOUNTY_START_BLOCK`
- `BSC_RPC_URL` or `NEXT_PUBLIC_BSC_RPC_URL`

Optional:

- `RUG_HUNTER_POLL_MS`
- `RUG_HUNTER_FEED_PATH`

Run locally:

```bash
npm run agent:dev
```

Run persistently with PM2:

```bash
pm2 start ecosystem.config.cjs --only rug-hunter
```
