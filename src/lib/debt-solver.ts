import { Expense, DebtTransfer, UserBalance } from '@/types';

/**
 * Calculate net balances for all users from expense history.
 * Positive balance = others owe you (creditor).
 * Negative balance = you owe others (debtor).
 */
export function calculateNetBalances(
  expenses: Expense[],
  usersMap: Map<string, string> // id -> name
): UserBalance[] {
  const balances = new Map<string, number>();

  // Initialize all users to 0
  for (const [userId] of usersMap) {
    balances.set(userId, 0);
  }

  for (const expense of expenses) {
    if (!expense.splits) continue;

    if (expense.is_settlement) {
      // Settlement: payer gives money to the single beneficiary
      // This means payer's balance goes DOWN (they paid out cash)
      // and the beneficiary's balance goes UP (they received cash)
      // But in our model: the "split" user_id is who RECEIVED the settlement
      // So: payer paid, beneficiary received
      const beneficiary = expense.splits[0];
      if (beneficiary) {
        const payerBal = balances.get(expense.paid_by) || 0;
        const beneficiaryBal = balances.get(beneficiary.user_id) || 0;
        // The payer already "gave" money, so their credit increases
        balances.set(expense.paid_by, payerBal + expense.total_amount);
        // The beneficiary "received" money, so their debt increases
        balances.set(beneficiary.user_id, beneficiaryBal - expense.total_amount);
      }
    } else {
      // Normal expense: payer paid the total, beneficiaries owe their splits
      const payerBal = balances.get(expense.paid_by) || 0;
      balances.set(expense.paid_by, payerBal + expense.total_amount);

      for (const split of expense.splits) {
        const userBal = balances.get(split.user_id) || 0;
        balances.set(split.user_id, userBal - split.amount_owed);
      }
    }
  }

  return Array.from(balances.entries()).map(([userId, netBalance]) => ({
    userId,
    userName: usersMap.get(userId) || 'Unknown',
    netBalance: Math.round(netBalance * 100) / 100,
  }));
}

/**
 * Minimum Cash Flow Algorithm (Greedy).
 * Takes net balances and returns the minimum set of transfers
 * to settle all debts.
 */
export function simplifyDebts(
  balances: UserBalance[]
): DebtTransfer[] {
  const transfers: DebtTransfer[] = [];

  // Filter out zero balances and create working copies
  const debtors: UserBalance[] = []; // negative balance (owe money)
  const creditors: UserBalance[] = []; // positive balance (are owed money)

  for (const b of balances) {
    if (b.netBalance < -0.01) {
      debtors.push({ ...b, netBalance: Math.abs(b.netBalance) });
    } else if (b.netBalance > 0.01) {
      creditors.push({ ...b });
    }
  }

  // Sort descending by amount for optimal matching
  debtors.sort((a, b) => b.netBalance - a.netBalance);
  creditors.sort((a, b) => b.netBalance - a.netBalance);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const transferAmount = Math.min(debtor.netBalance, creditor.netBalance);

    if (transferAmount > 0.01) {
      transfers.push({
        from: debtor.userId,
        from_name: debtor.userName,
        to: creditor.userId,
        to_name: creditor.userName,
        amount: Math.round(transferAmount * 100) / 100,
      });
    }

    debtor.netBalance -= transferAmount;
    creditor.netBalance -= transferAmount;

    if (debtor.netBalance < 0.01) i++;
    if (creditor.netBalance < 0.01) j++;
  }

  return transfers;
}

/**
 * Get what the current user owes or is owed.
 */
export function getUserDebts(
  transfers: DebtTransfer[],
  currentUserId: string
): { youOwe: DebtTransfer[]; theyOweYou: DebtTransfer[] } {
  return {
    youOwe: transfers.filter((t) => t.from === currentUserId),
    theyOweYou: transfers.filter((t) => t.to === currentUserId),
  };
}
