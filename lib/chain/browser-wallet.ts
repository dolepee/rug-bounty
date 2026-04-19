"use client";

import { createPublicClient, createWalletClient, custom, getAddress, http } from "viem";
import { bsc } from "viem/chains";

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

const BSC_CHAIN_ID_HEX = "0x38";
const publicRpcUrl = process.env.NEXT_PUBLIC_BSC_RPC_URL || "https://bsc-rpc.publicnode.com";

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export async function connectInjectedWallet() {
  if (!window.ethereum) {
    throw new Error("No injected wallet found. Open the app in MetaMask, OKX Wallet, or another EVM wallet browser.");
  }

  await ensureBscNetwork(window.ethereum);

  const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
  const address = getAddress(accounts[0]);
  const walletClient = createWalletClient({
    account: address,
    chain: bsc,
    transport: custom(window.ethereum),
  });

  return { walletClient, address };
}

export function getBrowserBscPublicClient() {
  return createPublicClient({
    chain: bsc,
    transport: http(publicRpcUrl, {
      batch: true,
      retryCount: 1,
      timeout: 15_000,
    }),
  });
}

async function ensureBscNetwork(provider: EthereumProvider) {
  const currentChainId = (await provider.request({ method: "eth_chainId" })) as string;
  if (currentChainId.toLowerCase() === BSC_CHAIN_ID_HEX) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_CHAIN_ID_HEX }],
    });
    return;
  } catch {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: BSC_CHAIN_ID_HEX,
          chainName: "BNB Smart Chain",
          nativeCurrency: {
            name: "BNB",
            symbol: "BNB",
            decimals: 18,
          },
          rpcUrls: [publicRpcUrl],
          blockExplorerUrls: ["https://bscscan.com"],
        },
      ],
    });
  }
}
