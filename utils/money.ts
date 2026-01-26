import type { Transaction, TransactionType } from '@/types/transaction';

export function calculateTotalByType(
  transactions: ReadonlyArray<Transaction>,
  type: TransactionType
): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateBalance(transactions: ReadonlyArray<Transaction>): number {
  const income = calculateTotalByType(transactions, 'income');
  const expenses = calculateTotalByType(transactions, 'expense');
  return income - expenses;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  // Keep it deterministic + local-first (no device locale dependency for MVP).
  // Swap to Intl.NumberFormat(localeFromDevice) later if desired.
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

