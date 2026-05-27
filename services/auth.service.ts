import * as SecureStore from "expo-secure-store";
import { API_ENDPOINTS } from "../constants/api";
import { apiClient } from "./api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  currency?: string;
  monthly_income?: number;
  savings_target_type?: string;
  savings_target_value?: number;
}

export interface AuthResponse {
  token: string;
  user?: User; // Made optional since backend doesn't return user in login
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  [key: string]: any;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log("🔐 Attempting login for:", credentials.email);

    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.LOGIN,
        credentials,
      );

      console.log("✅ Login successful");
      console.log("  Full response:", JSON.stringify(response, null, 2));

      // Extract data from backend response
      const { data } = response;
      if (!data || !data.access_token) {
        throw new Error("Invalid login response: missing access_token");
      }

      const authResponse: AuthResponse = {
        token: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        // User will be fetched separately via /auth/me
      };

      console.log("  Token type:", typeof authResponse.token);
      console.log("  Token length:", authResponse.token?.length);

      // Store token securely
      await SecureStore.setItemAsync("auth_token", authResponse.token);
      if (authResponse.refreshToken) {
        await SecureStore.setItemAsync("refresh_token", authResponse.refreshToken);
      }
      console.log("  Token stored securely");

      return authResponse;
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    console.log("🚪 Logging out...");

    try {
      await apiClient.post(API_ENDPOINTS.LOGOUT);
      console.log("  Backend logout successful");
    } catch (error) {
      console.error("  Backend logout failed (continuing anyway):", error);
    } finally {
      // Always remove token locally
      await SecureStore.deleteItemAsync("auth_token");
      console.log("  Token removed from device");
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    console.log("🔐 Attempting register for:", credentials.email);

    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.REGISTER,
        {
          full_name: credentials.name,
          email: credentials.email,
          password: credentials.password,
          phone_number: credentials.phone_number || null,
          currency: credentials.currency || "RWF",
          monthly_income: credentials.monthly_income || 0,
          savings_target_type: credentials.savings_target_type || "percentage",
          savings_target_value: credentials.savings_target_value || 20,
        },
      );

      console.log("✅ Register successful");
      console.log("  Full response:", JSON.stringify(response, null, 2));

      const { data } = response;
      if (!data || !data.access_token) {
        throw new Error("Invalid register response: missing access_token");
      }

      const authResponse: AuthResponse = {
        token: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
      };

      await SecureStore.setItemAsync("auth_token", authResponse.token);
      if (authResponse.refreshToken) {
        await SecureStore.setItemAsync("refresh_token", authResponse.refreshToken);
      }
      console.log("  Token stored securely from register");

      return authResponse;
    } catch (error) {
      console.error("❌ Register failed:", error);
      throw error;
    }
  },
  
  async socialLogin(provider: "google" | "apple", data: { email: string; full_name: string; social_id: string }): Promise<AuthResponse> {
    console.log(`🔐 Attempting ${provider} login for:`, data.email);
    
    try {
      const response = await apiClient.post<any>(
        "/auth/social-login",
        {
          provider,
          email: data.email,
          full_name: data.full_name,
          social_id: data.social_id,
        },
      );
      
      console.log(`✅ ${provider} login successful`);
      const { data: resData } = response;
      
      if (!resData || !resData.access_token) {
        throw new Error("Invalid social login response");
      }
      
      const authResponse: AuthResponse = {
        token: resData.access_token,
        refreshToken: resData.refresh_token,
        tokenType: resData.token_type,
        expiresIn: resData.expires_in,
      };
      
      await SecureStore.setItemAsync("auth_token", authResponse.token);
      if (authResponse.refreshToken) {
        await SecureStore.setItemAsync("refresh_token", authResponse.refreshToken);
      }
      
      return authResponse;
    } catch (error) {
      console.error(`❌ ${provider} login failed:`, error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<User> {
    console.log("👤 Fetching current user...");
    const response = await apiClient.get<any>(API_ENDPOINTS.ME);
    return response.data; // Extract user data from response wrapper
  },

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync("auth_token");
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    const isAuth = !!token;
    console.log(
      "🔍 Auth check:",
      isAuth ? "Authenticated" : "Not authenticated",
    );
    return isAuth;
  },
};
