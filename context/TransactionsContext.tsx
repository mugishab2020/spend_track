import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiClient } from "@/services/api";
import { runDailyDigestIfNeeded } from "@/services/dailyDigest.service";
import { useNotifications } from "./NotificationsContext";
import type { Transaction, TransactionCategory, TransactionType } from "@/types/transaction";
import { useAuth } from "./AuthContext";

export type NewTransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;   // UUID for expense, label for income
  date: string;
  description?: string;
};

type TransactionsContextValue = {
  transactions: ReadonlyArray<Transaction>;
  addTransaction: (input: NewTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  totals: { income: number; expenses: number; balance: number };
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

// Normalize the unified /transactions response to our Transaction type
function normalize(raw: any): Transaction {
  return {
    id: raw.id,
    title: raw.description || raw.category || (raw.type === "income" ? "Income" : "Expense"),
    amount: raw.amount,
    type: raw.type,
    category: raw.category_id ?? raw.category ?? "",
    date: raw.created_at ?? new Date().toISOString(),
    createdAt: raw.created_at ?? new Date().toISOString(),
  };
}

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadTransactions();
      runDailyDigestIfNeeded(addNotification);
    } else {
      setTransactions([]);
    }
  }, [isAuthenticated]);

  const loadTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date();
      const res = await apiClient.get<any>(
        `/transactions?month=${now.getMonth() + 1}&year=${now.getFullYear()}&limit=500`
      );
      const items: any[] = res.data?.items ?? [];
      setTransactions(items.map(normalize));
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
      console.error("Load transactions error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = async (input: NewTransactionInput) => {
    setError(null);
    try {
      const now = new Date();
      const body: any = {
        amount: input.amount,
        type: input.type,
        description: input.description,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        source: "manual",
        status: "completed",
      };

      if (input.type === "expense") {
        body.category_id = input.category;
      } else {
        body.category = input.category; // e.g. "Salary"
      }

      const res = await apiClient.post<any>("/transactions", body);
      setTransactions((prev) => [normalize(res.data), ...prev]);
    } catch (err: any) {
      setError(err.message || "Failed to add transaction");
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    setError(null);
    try {
      await apiClient.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete transaction");
      throw err;
    }
  };

  const refreshTransactions = async () => {
    await loadTransactions();
  };

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const value = useMemo<TransactionsContextValue>(
    () => ({ transactions, addTransaction, deleteTransaction, refreshTransactions, isLoading, error, totals }),
    [transactions, totals, isLoading, error],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions(): TransactionsContextValue {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionsProvider");
  return ctx;
}
