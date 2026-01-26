export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'Salary'
  | 'Freelance'
  | 'Investments'
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Bills'
  | 'Health'
  | 'Entertainment'
  | 'Other';

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  /**
   * ISO 8601 date string (e.g. 2026-01-23T08:00:00.000Z)
   */
  date: string;
  createdAt: string;
};

