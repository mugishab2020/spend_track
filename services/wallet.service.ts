import { API_ENDPOINTS } from "../constants/api";
import { Transaction } from "../types/transaction";
import { apiClient } from "./api";

export interface WalletSummary {
  income: number;
  expenses: number;
  balance: number;
  recent?: Transaction[];
}

export const walletService = {
  async getSummary(): Promise<WalletSummary> {
    const response = await apiClient.get<any>(API_ENDPOINTS.WALLET_BALANCE);
    return response.data; // Extract wallet summary from response wrapper
  },

  async addIncome(data: {
    title: string;
    amount: number;
    category: string;
    date: string;
  }): Promise<Transaction> {
    const response = await apiClient.post<any>(API_ENDPOINTS.WALLET_INCOME, {
      ...data,
      type: "income",
    });
    return response.data; // Extract created transaction from response wrapper
  },
};
