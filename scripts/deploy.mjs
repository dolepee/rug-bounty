import fs from "node:fs";
import path from "node:path";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

const rpcUrl = process.env.BSC_RPC_URL || process.env.NEXT_PUBLIC_BSC_RPC_URL || "https://bsc-rpc.publicnode.com";
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error("Missing PRIVATE_KEY env var.");
}

const abiPath = path.join(process.cwd(), "out", "contracts_RugBountyVault_sol_RugBountyVault.abi");
const binPath = path.join(process.cwd(), "out", "contracts_RugBountyVault_sol_RugBountyVault.bin");

if (!fs.existsSync(abiPath) || !fs.existsSync(binPath)) {
  throw new Error("Compiled contract artifacts not found. Run `npm run compile:contract` first.");
}

const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
const bytecode = `0x${fs.readFileSync(binPath, "utf8").trim()}`;

async function main() {
  const account = privateKeyToAccount(privateKey);
  const transport = http(rpcUrl, { retryCount: 1, timeout: 15_000 });
  const walletClient = createWalletClient({
    account,
    chain: bsc,
    transport,
  });

  const publicClient = createPublicClient({
    chain: bsc,
    transport,
  });

  console.log(`[deploy] deploying RugBountyVault from ${account.address}`);
  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    account,
    chain: bsc,
  });

  console.log(`[deploy] tx hash: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`[deploy] contract address: ${receipt.contractAddress}`);
}

main().catch((error) => {
  console.error("[deploy] failed", error);
  process.exit(1);
});
