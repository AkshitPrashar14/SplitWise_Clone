type BalanceMap = Record<string, number>; // userId -> net balance

export function simplifyDebts(balances: BalanceMap) {
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, balance] of Object.entries(balances)) {
    if (balance < 0) debtors.push({ id, amount: Math.abs(balance) });
    else if (balance > 0) creditors.push({ id, amount: balance });
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount: settledAmount,
    });

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount < 0.001) i++;
    if (creditor.amount < 0.001) j++;
  }

  return transactions;
}

export function calculateNetBalances(expenses: any[], settlements: any[]) {
  const balances: Record<string, BalanceMap> = {}; // currency -> userId -> balance

  for (const expense of expenses) {
    const curr = expense.currency;
    if (!balances[curr]) balances[curr] = {};

    balances[curr][expense.paidById] = (balances[curr][expense.paidById] || 0) + expense.amount;

    for (const split of expense.splits) {
      balances[curr][split.userId] = (balances[curr][split.userId] || 0) - split.amount;
    }
  }

  for (const settlement of settlements) {
    const curr = settlement.currency;
    if (!balances[curr]) balances[curr] = {};

    balances[curr][settlement.paidById] = (balances[curr][settlement.paidById] || 0) + settlement.amount;
    balances[curr][settlement.paidToId] = (balances[curr][settlement.paidToId] || 0) - settlement.amount;
  }

  const simplifiedDebts: Record<string, ReturnType<typeof simplifyDebts>> = {};
  
  for (const curr of Object.keys(balances)) {
    simplifiedDebts[curr] = simplifyDebts(balances[curr]);
  }

  return { rawBalances: balances, simplifiedDebts };
}
