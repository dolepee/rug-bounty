type BrokenOathInput = {
  ticker: string;
  floor: string;
  currentBalance: string;
  hunter: string;
  bondAmount: string;
  txHash: string;
};

export function generateBrokenOathPost(input: BrokenOathInput) {
  return `${input.ticker} broke its oath.\n\nFloor: ${input.floor}\nWallet at slash: ${input.currentBalance}\nBond: ${input.bondAmount} BNB slashed to ${input.hunter}\n\nProof: https://bscscan.com/tx/${input.txHash}`;
}
