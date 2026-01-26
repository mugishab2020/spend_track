import type { TransactionCategory } from '@/types/transaction';

export const TRANSACTION_CATEGORIES: ReadonlyArray<TransactionCategory> = [
  'Salary',
  'Freelance',
  'Investments',
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Other',
] as const;

