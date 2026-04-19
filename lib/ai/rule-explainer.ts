type RuleExplainerInput = {
  ticker: string;
  currentBalance: string;
  declaredRetainedBalance: string;
  hunter: string;
  bondAmount: string;
};

export function explainRuleOutcome(input: RuleExplainerInput) {
  return `The creator promised to hold at least ${input.declaredRetainedBalance} ${input.ticker} across their declared wallets. At slash time the vault read only ${input.currentBalance}, which is below the public floor. The first hunter to call resolveBond, ${input.hunter}, took the ${input.bondAmount} BNB bond.`;
}
