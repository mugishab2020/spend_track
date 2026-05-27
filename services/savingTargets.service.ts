import { API_ENDPOINTS } from "../constants/api";
import {
    CreateSavingTargetRequest,
    SavingTarget,
    UpdateSavingTargetRequest,
} from "../types/savingTarget";
import { apiClient } from "./api";

export const savingTargetsService = {
  async getAll(): Promise<SavingTarget[]> {
    const response = await apiClient.get<any>(API_ENDPOINTS.SAVING_TARGETS);
    const data = response?.data;
    if (!data) return [];
    // Backend returns a single goal object, not an array — wrap it
    if (Array.isArray(data)) return data.filter((t) => t && t.targetAmount != null);
    if (data.targetAmount != null || data.target_amount != null) {
      return [normalizeSavingTarget(data)];
    }
    return [];
  },

  async create(data: CreateSavingTargetRequest): Promise<SavingTarget> {
    const response = await apiClient.post<any>(API_ENDPOINTS.SAVING_TARGETS, {
      target_amount: data.targetAmount,
    });
    return normalizeSavingTarget(response.data);
  },

  async update(id: string, data: UpdateSavingTargetRequest): Promise<SavingTarget> {
    const response = await apiClient.put<any>(API_ENDPOINTS.SAVING_TARGET_BY_ID(id), {
      target_amount: data.targetAmount,
    });
    return normalizeSavingTarget(response.data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.SAVING_TARGET_BY_ID(id));
  },
};

function normalizeSavingTarget(raw: any): SavingTarget {
  const now = new Date();
  return {
    id: raw.id ?? "goal",
    userId: raw.user_id ?? "",
    month: raw.month ?? now.getMonth() + 1,
    year: raw.year ?? now.getFullYear(),
    targetAmount: raw.targetAmount ?? raw.target_amount ?? 0,
    currentSaved: raw.currentSaved ?? raw.current_saved ?? 0,
    description: raw.description,
    createdAt: raw.created_at ?? now.toISOString(),
    updatedAt: raw.updated_at ?? now.toISOString(),
  };
}
