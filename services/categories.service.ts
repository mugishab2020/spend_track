import { API_ENDPOINTS } from "../constants/api";
import { apiClient } from "./api";

export interface Category {
  id: string;
  name: string;
  icon: string;
  type?: "income" | "expense";
  cap_amount?: number | null;
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
    return response.data; // Extract categories array from response wrapper
  },

  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await apiClient.post<any>(API_ENDPOINTS.CATEGORIES, data);
    return response.data; // Extract created category from response wrapper
  },

  async update(
    id: string,
    data: Partial<CreateCategoryDto>,
  ): Promise<Category> {
    const response = await apiClient.put<any>(
      API_ENDPOINTS.CATEGORY_BY_ID(id),
      data,
    );
    return response.data; // Extract updated category from response wrapper
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.CATEGORY_BY_ID(id));
  },
};
