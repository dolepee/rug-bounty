import { decodeEventLog, type Address, type Hex, getAddress } from "viem";
import { getBscPublicClient } from "@/lib/chain/bsc";
import { erc20MetadataAbi } from "@/lib/chain/erc20";
import { TOKEN_MANAGER2_ADDRESS, tokenManager2Abi } from "@/lib/fourmeme/token-manager2";

export type ParsedTokenCreate = {
  token: Address;
  creator: Address;
  requestId: bigint;
  name: string;
  symbol: string;
  totalSupply: bigint;
  launchTime: bigint;
  launchFee: bigint;
  tokenDecimals: number;
  blockNumber: bigint;
  txHash: Hex;
  tokenManager: Address;
  rawLogIndex: number;
};

export async function parseTokenCreateFromTxHash(txHash: Hex): Promise<ParsedTokenCreate> {
  const client = getBscPublicClient();
  const receipt = await client.getTransactionReceipt({ hash: txHash });

  for (const log of receipt.logs) {
    if (getAddress(log.address) !== getAddress(TOKEN_MANAGER2_ADDRESS)) {
      continue;
    }

    try {
      const decoded = decodeEventLog({
        abi: tokenManager2Abi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName !== "TokenCreate") {
        continue;
      }

      const args = decoded.args as unknown as {
        creator: Address;
        token: Address;
        requestId: bigint;
        name: string;
        symbol: string;
        totalSupply: bigint;
        launchTime: bigint;
        launchFee: bigint;
      };

      let tokenDecimals = 18;
      try {
        tokenDecimals = Number(
          await client.readContract({
            address: getAddress(args.token),
            abi: erc20MetadataAbi,
            functionName: "decimals",
          }),
        );
      } catch {
        tokenDecimals = 18;
      }

      return {
        creator: getAddress(args.creator),
        token: getAddress(args.token),
        requestId: args.requestId,
        name: args.name,
        symbol: args.symbol,
        totalSupply: args.totalSupply,
        launchTime: args.launchTime,
        launchFee: args.launchFee,
        tokenDecimals,
        blockNumber: receipt.blockNumber,
        txHash,
        tokenManager: getAddress(TOKEN_MANAGER2_ADDRESS),
        rawLogIndex: Number(log.logIndex ?? 0),
      };
    } catch {
      continue;
    }
  }

  throw new Error("No TokenCreate event found for this transaction hash on TokenManager2.");
}
