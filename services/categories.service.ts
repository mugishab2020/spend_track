import { API_ENDPOINTS } from "../constants/api";
import { apiClient } from "./api";

export interface Category {
  id: string;
  name: string;
  icon: string;
  type?: "income" | "expense";
  cap_amount?: number | null;
  is_locked?: boolean;
}

export interface CreateCategoryDto {
  name: string;
  icon: string;
  type?: "income" | "expense";
  cap_amount?: number | null;
}

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    const response = await apiClient.get<any>(API_ENDPOINTS.CATEGORIES);
    // Backend wraps responses under a `data` key: { data: [...] }
    // Unwrap so callers receive the actual Category[] array
    return response.data?.data ?? response.data;
  },

  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await apiClient.post<any>(API_ENDPOINTS.CATEGORIES, data);
    return response.data?.data ?? response.data;
  },

  async update(
    id: string,
    data: Partial<CreateCategoryDto>,
  ): Promise<Category> {
    const response = await apiClient.put<any>(
      API_ENDPOINTS.CATEGORY_BY_ID(id),
      data,
    );
    return response.data?.data ?? response.data;
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.CATEGORY_BY_ID(id));
  },
};
