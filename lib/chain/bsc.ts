import { createPublicClient, createWalletClient, fallback, http, webSocket, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

const cleanEnv = (value?: string | null) => value?.trim() || undefined;

const defaultHttpRpc = cleanEnv(process.env.BSC_RPC_URL) || "https://bsc-rpc.publicnode.com";
const defaultWsRpc = cleanEnv(process.env.BSC_WS_RPC_URL);

const fallbackRpcs = [
  defaultHttpRpc,
  "https://1rpc.io/bnb",
  "https://bsc-dataseed.bnbchain.org",
  "https://bsc-dataseed-public.bnbchain.org",
];

export function getBscPublicClient(): PublicClient {
  if (defaultWsRpc) {
    return createPublicClient({
      chain: bsc,
      transport: webSocket(defaultWsRpc),
    });
  }

  return createPublicClient({
    chain: bsc,
    transport: fallback(
      fallbackRpcs.map((url) =>
        http(url, {
          batch: true,
          retryCount: 1,
          timeout: 15_000,
        }),
      ),
      { rank: false },
    ),
  });
}

export const bscRpcUrl = defaultHttpRpc;

export function getAgentWalletClient() {
  const privateKey = cleanEnv(process.env.PRIVATE_KEY) as `0x${string}` | undefined;
  if (!privateKey) {
    throw new Error("Missing PRIVATE_KEY env var.");
  }

  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: bsc,
    transport: http(defaultHttpRpc),
  });
}
