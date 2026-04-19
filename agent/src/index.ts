import { getBscPublicClient } from "../../lib/chain/bsc";

async function main() {
  const client = getBscPublicClient();
  const chainId = await client.getChainId();
  console.log(`[rug-hunter] connected to chain ${chainId}`);
  console.log("[rug-hunter] pass 1 skeleton ready: subscribe to BondCreated, poll declared wallet floors, call resolveBond when breached.");
}

main().catch((error) => {
  console.error("[rug-hunter] fatal", error);
  process.exit(1);
});
