import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../constants/api';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private isRefreshing = false;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    console.log('🔧 API Client initialized with BASE_URL:', this.baseURL);
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch {
      return null;
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) return null;
    this.isRefreshing = true;
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) return null;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return null;
      }

      const json = await response.json();
      const newToken = json?.data?.access_token;
      if (newToken) {
        await SecureStore.setItemAsync('auth_token', newToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
    const token = await this.getAuthToken();
    const fullUrl = `${this.baseURL}${endpoint}`;

    console.log('\n📡 API Request Starting...');
    console.log('  Method:', options.method || 'GET');
    console.log('  URL:', fullUrl);
    console.log('  Has Token:', !!token);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.headers) Object.assign(headers, options.headers);
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (options.body) console.log('  Body:', options.body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(fullUrl, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);

      console.log('  Status:', response.status, response.statusText);

      // Auto-refresh on 401
      if (response.status === 401 && retry) {
        console.log('🔄 Token expired, attempting refresh...');
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          console.log('✅ Token refreshed, retrying...');
          return this.request<T>(endpoint, options, false);
        }
        // Refresh failed — clear stored credentials
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }

      if (!response.ok) {
        let errorData: any = {};
        try { errorData = await response.json(); } catch {}
        console.error('  Error Data:', JSON.stringify(errorData));

        let errorMessage = "An unexpected error occurred. Please try again later.";
        if (errorData) {
          if (errorData.detail) {
            if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
              errorMessage = errorData.detail
                .map((err: any) => err.msg || "Validation error")
                .join(", ");
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.error.message) {
              errorMessage = errorData.error.message;
            }
          }
        }

        if (response.status === 401) {
          errorMessage = "Invalid login credentials or session expired.";
        } else if (response.status === 403) {
          errorMessage = "You are not allowed to perform this action.";
        } else if (response.status === 404) {
          errorMessage = "The requested service is currently unavailable.";
        } else if (response.status === 408) {
          errorMessage = "Request timed out. Please check your connection.";
        } else if (response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

        throw new ApiError(response.status, errorMessage, errorData);
      }

      if (response.status === 204) return {} as T;

      const data = await response.json();
      // Avoid logging full response bodies (can be large and block the JS thread).
      try {
        if (data && typeof data === 'object') {
          if (Array.isArray(data)) {
            console.log(`  Response Data: Array[${data.length}]`);
          } else if (data.items && Array.isArray(data.items)) {
            console.log(`  Response Data: items=${data.items.length}`);
          } else if (data.data && Array.isArray(data.data)) {
            console.log(`  Response Data: data=${data.data.length}`);
          } else {
            console.log('  Response Data: object keys=', Object.keys(data).slice(0,10));
          }
        } else {
          console.log('  Response Data:', typeof data);
        }
      } catch (e) {
        console.log('  Response Data: <unavailable>');
      }
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('\n❌ API Request Failed');
      console.error('  URL:', fullUrl);
      console.error('  Error Message:', error instanceof Error ? error.message : String(error));

      if (error instanceof ApiError) {
        console.error('  Status Code:', error.status);
        console.error('  Error Data:', error.data);
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timed out. Please check your network connection.');
      }

      throw new ApiError(0, 'Network error - Cannot reach backend');
    }
  }

  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>(endpoint + queryString, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
