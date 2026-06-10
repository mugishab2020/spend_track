import { API_ENDPOINTS } from "../constants/api";
import { apiClient } from "./api";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  choices?: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  message?: {
    role: string;
    content: string;
  };
}

export const aiService = {
  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await apiClient.post<any>(API_ENDPOINTS.AI_CHAT, {
      messages,
    });

    const aiResponse = response.data; // Extract AI response from wrapper

    // Handle different response formats
    if (aiResponse.choices && aiResponse.choices.length > 0) {
      return aiResponse.choices[0].message.content;
    }

    if (aiResponse.message) {
      return aiResponse.message.content;
    }

    throw new Error("Invalid AI response format");
  },
  async previewDistribution(): Promise<any> {
    const res = await apiClient.get<any>(API_ENDPOINTS.AI_DISTRIBUTE_FUNDS_PREVIEW);
    return res.data;
  },

  async applyDistribution(): Promise<any> {
    const res = await apiClient.post<any>(API_ENDPOINTS.AI_DISTRIBUTE_FUNDS_APPLY);
    return res.data;
  }
  ,
  async status(month?: number, year?: number): Promise<any> {
    const params: any = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await apiClient.get<any>("/ai/status", { params });
    return res.data;
  }
};
