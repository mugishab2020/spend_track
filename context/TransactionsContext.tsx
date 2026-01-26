import React, { createContext, useContext, useMemo, useState } from "react";

import type {
  Transaction,
  TransactionCategory,
  TransactionType,
} from "@/types/transaction";
import { calculateBalance, calculateTotalByType } from "@/utils/money";

export type NewTransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO string
};

type TransactionsContextValue = {
  transactions: ReadonlyArray<Transaction>;
  addTransaction: (input: NewTransactionInput) => void;
  totals: {
    income: number;
    expenses: number;
    balance: number;
  };
};

const TransactionsContext = createContext<TransactionsContextValue | null>(
  null,
);

function createId(): string {
  // Local-first friendly; replace with UUID later if needed.
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function TransactionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([
    // Sample data for demonstration
    {
      id: "1",
      title: "Salary",
      amount: 5000,
      type: "income",
      category: "Salary",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Freelance Project",
      amount: 1200,
      type: "income",
      category: "Freelance",
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      title: "Grocery Shopping",
      amount: 150,
      type: "expense",
      category: "Food",
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "4",
      title: "Gas Station",
      amount: 60,
      type: "expense",
      category: "Transportation",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      createdAt: new Date().toISOString(),
    },
    {
      id: "5",
      title: "Coffee Shop",
      amount: 25,
      type: "expense",
      category: "Food",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      createdAt: new Date().toISOString(),
    },
    {
      id: "6",
      title: "Movie Tickets",
      amount: 40,
      type: "expense",
      category: "Entertainment",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      createdAt: new Date().toISOString(),
    },
    {
      id: "7",
      title: "Internet Bill",
      amount: 80,
      type: "expense",
      category: "Utilities",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      createdAt: new Date().toISOString(),
    },
    {
      id: "8",
      title: "Bonus",
      amount: 800,
      type: "income",
      category: "Bonus",
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
      createdAt: new Date().toISOString(),
    },
  ]);

  const addTransaction = (input: NewTransactionInput) => {
    const now = new Date().toISOString();
    const next: Transaction = {
      id: createId(),
      title: input.title.trim(),
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: input.date,
      createdAt: now,
    };

    setTransactions((prev) => [next, ...prev]);
  };

  const totals = useMemo(() => {
    const income = calculateTotalByType(transactions, "income");
    const expenses = calculateTotalByType(transactions, "expense");
    const balance = calculateBalance(transactions);
    return { income, expenses, balance };
  }, [transactions]);

  const value = useMemo<TransactionsContextValue>(
    () => ({ transactions, addTransaction, totals }),
    [transactions, totals],
  );

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions(): TransactionsContextValue {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error("useTransactions must be used within TransactionsProvider");
  }
  return ctx;
}
