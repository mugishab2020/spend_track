export type TransactionType = 'income' | 'expense';

// category is now just a string (UUID from backend)
export type TransactionCategory = string;

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

