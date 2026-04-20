# RugBounty Skill Wrapper

This folder exposes RugBounty as a minimal HTTP skill surface for agent builders.

Commands:

- `parse_launch`
  - `POST /api/skill/parse-launch`
  - body: `{ "txHash": "0x..." }`
- `compile_oath`
  - `POST /api/skill/compile-oath`
  - body: `{ "text": "...", "tokenDecimals": 18 }`
- `create_bond_payload`
  - `POST /api/skill/create-bond-payload`
  - returns unsigned `createBond` calldata inputs plus proof hashes
- `watch_bond`
  - `GET /api/skill/watch-bond/:id`
  - returns live bond state plus the next valid action

This wrapper does not sign transactions. It prepares and monitors launch-accountability actions so another agent runtime can execute them safely.
