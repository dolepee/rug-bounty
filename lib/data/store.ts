export type BondStatus = "ACTIVE" | "SLASHED" | "REFUNDED" | "AT_RISK";

export type BondRecord = {
  id: string;
  tokenName: string;
  ticker: string;
  tokenAddress: string;
  creator: string;
  declaredCreatorWallets: string[];
  bondAmountBnb: number;
  declaredFloor: string;
  currentBalance: string;
  status: BondStatus;
  expiresAtIso: string;
  launchTxHash: string;
  bondTxHash: string;
  slashTxHash?: string;
  notes: string;
};

export const mockBonds: BondRecord[] = [
  {
    id: "moonchad",
    tokenName: "MoonChad",
    ticker: "$MOONCHAD",
    tokenAddress: "0x6D9fB9A7aCe07A1D1769CbbEfC9E4eB40d1325e9",
    creator: "0xA3B3cDD3e6C57C0f2B9b6bA9D8e8458D72555F11",
    declaredCreatorWallets: ["0xA3B3cDD3e6C57C0f2B9b6bA9D8e8458D72555F11"],
    bondAmountBnb: 0.05,
    declaredFloor: "100,000,000",
    currentBalance: "42,300,000",
    status: "SLASHED",
    expiresAtIso: "2026-04-20T12:00:00.000Z",
    launchTxHash: "0x9ea90fc524c1f1de90f2b5973523d83f824f140b402733769fb566c0a0d9a100",
    bondTxHash: "0x4f4e892f6036cf4a17b4f6612db6c9fae415c17068cd9562196eb7541f76b845",
    slashTxHash: "0x8b2b845269209369eb5e852ff5d92cd3fcc5d0b0b454c9d19146f5522f2b99fe",
    notes: "Agent-triggered slash after creator wallet floor breached.",
  },
  {
    id: "cleanguy",
    tokenName: "CleanGuy",
    ticker: "$CLEANGUY",
    tokenAddress: "0x2d4180b989B3CB5c70C7b1fcb2614c9D32E68aA1",
    creator: "0x77A0b5e6844A903d1f9730E0D57F53B6AB11eA57",
    declaredCreatorWallets: ["0x77A0b5e6844A903d1f9730E0D57F53B6AB11eA57"],
    bondAmountBnb: 0.05,
    declaredFloor: "100,000,000",
    currentBalance: "121,000,000",
    status: "ACTIVE",
    expiresAtIso: "2026-04-20T18:00:00.000Z",
    launchTxHash: "0xd7904cf44616632ec4e28bd18b06ea657fcb7c14b93a1c7ae9a5fe4f4fd5de5d",
    bondTxHash: "0x15446b18d889010d8aa8e4986c1a4e76320e86b83bc5d2b4b553ce1a3e17b610",
    notes: "Clean bonded launch still above the declared floor.",
  },
  {
    id: "fairbag",
    tokenName: "FairBag",
    ticker: "$FAIRBAG",
    tokenAddress: "0x77441821E81B88e470B766127E67c336261F14A0",
    creator: "0xF19042d1C1B70Bf3A7b3A675f71011CE6C17E37c",
    declaredCreatorWallets: ["0xF19042d1C1B70Bf3A7b3A675f71011CE6C17E37c"],
    bondAmountBnb: 0.1,
    declaredFloor: "250,000,000",
    currentBalance: "253,100,000",
    status: "AT_RISK",
    expiresAtIso: "2026-04-19T23:45:00.000Z",
    launchTxHash: "0x95c8ebc32ab3bbdd24d6807ca9e905f1ffae41be8d4ece4e526ea2f11f99ee52",
    bondTxHash: "0x4a068c35d23c3ad8da3627f81a92581a1961b62ca436c5baf6c86ec047d03031",
    notes: "Large bonded launch close to the floor and near expiry.",
  },
];

export type HunterFeedItem = {
  id: string;
  label: string;
  txHash?: string;
  createdAtIso: string;
};

export const mockHunterFeed: HunterFeedItem[] = [
  {
    id: "hunt-3",
    label: "bond #moonchad slashed to Rug Hunter Agent",
    txHash: "0x8b2b845269209369eb5e852ff5d92cd3fcc5d0b0b454c9d19146f5522f2b99fe",
    createdAtIso: "2026-04-19T14:41:00.000Z",
  },
  {
    id: "hunt-2",
    label: "floor breach detected for bond #moonchad",
    createdAtIso: "2026-04-19T14:39:10.000Z",
  },
  {
    id: "hunt-1",
    label: "watching bond #cleanguy",
    createdAtIso: "2026-04-19T14:20:00.000Z",
  },
];

export function getAllBonds() {
  return mockBonds;
}

export function getBondById(id: string) {
  return mockBonds.find((bond) => bond.id === id);
}

export function getBrokenOaths() {
  return mockBonds.filter((bond) => bond.status === "SLASHED");
}

export function getHunterFeed() {
  return mockHunterFeed;
}
