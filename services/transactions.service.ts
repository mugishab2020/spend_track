import { API_ENDPOINTS } from "../constants/api";
import { Transaction } from "../types/transaction";
import { apiClient } from "./api";

export interface TransactionFilters {
  type?: "income" | "expense";
  category?: string;
  start?: string;
  end?: string;
  limit?: number;
  offset?: number;
}

export interface CreateTransactionDto {
  category_id: string;
  amount: number;
  description?: string;
  month: number;
  year: number;
}

export const transactionsService = {
  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    const response = await apiClient.get<any>(API_ENDPOINTS.TRANSACTIONS, filters);
    const raw: any[] = response.data ?? [];
    return raw.map(normalizeExpense);
  },

  async getById(id: string): Promise<Transaction> {
    const response = await apiClient.get<any>(API_ENDPOINTS.TRANSACTION_BY_ID(id));
    return normalizeExpense(response.data);
  },

  async create(data: CreateTransactionDto): Promise<Transaction> {
    const response = await apiClient.post<any>(API_ENDPOINTS.TRANSACTIONS, data);
    return normalizeExpense(response.data);
  },

  async update(id: string, data: Partial<CreateTransactionDto>): Promise<Transaction> {
    const response = await apiClient.put<any>(API_ENDPOINTS.TRANSACTION_BY_ID(id), data);
    return normalizeExpense(response.data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.TRANSACTION_BY_ID(id));
  },
};

function normalizeExpense(raw: any): Transaction {
  return {
    id: raw.expense_id ?? raw.id,
    title: raw.description || "Expense",
    amount: raw.amount,
    type: "expense",
    category: raw.category_id ?? raw.category,
    date: raw.created_at ?? new Date().toISOString(),
    createdAt: raw.created_at ?? new Date().toISOString(),
  };
}
