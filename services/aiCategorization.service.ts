import { API_ENDPOINTS } from "../constants/api";
import { apiClient } from "./api";

export interface CategorySuggestion {
  suggested_category_id: string;
  suggested_category_name: string;
  confidence: number;
  reasoning: string;
  alternatives?: Array<{
    category_id: string;
    category_name: string;
    confidence: number;
    reasoning: string;
  }>;
}

export interface CategorizationResult {
  transaction_id: string;
  transaction_description: string;
  transaction_amount: number;
  current_category_id: string | null;
  suggested_category_id: string;
  suggested_category_name: string;
  confidence: number;
  reasoning: string;
  alternatives?: Array<{
    category_id: string;
    category_name: string;
    confidence: number;
    reasoning: string;
  }>;
}

export interface BulkCategorizationResult {
  message: string;
  categorized_count: number;
  transactions: Array<{
    transaction_id: string;
    description: string;
    amount: number;
    category_name: string;
    confidence: number;
    reasoning: string;
  }>;
}

export const aiCategorizationService = {
  /**
   * Use AI to suggest a category for a single transaction
   */
  async categorizeTransaction(transactionId: string): Promise<CategorizationResult> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.AI_CATEGORIZE_TRANSACTION,
      { transaction_id: transactionId }
    );
    return response.data;
  },

  /**
   * Use AI to automatically categorize all uncategorized transactions
   */
  async categorizeBulk(): Promise<BulkCategorizationResult> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.AI_CATEGORIZE_BULK,
      {}
    );
    return response.data;
  },
};
