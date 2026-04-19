import fs from "node:fs";
import path from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const walletEntries = ["creator", "agent", "backupHunter"] as const;

const wallets = walletEntries.map((role) => {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return {
    role,
    address: account.address,
    privateKey,
  };
});

const filePath = path.join(process.cwd(), ".generated-wallets.json");
fs.writeFileSync(filePath, JSON.stringify({ createdAt: new Date().toISOString(), wallets }, null, 2));

for (const wallet of wallets) {
  console.log(`${wallet.role}: ${wallet.address}`);
}
console.log(`saved: ${filePath}`);
