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
};
