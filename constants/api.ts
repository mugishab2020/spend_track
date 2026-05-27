export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.198:8000/api/v1",
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "30000"),
};

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  ME: "/users/me",
  LOGOUT: "/auth/logout",

  // Transaction endpoints
  TRANSACTIONS: "/transactions",
  TRANSACTION_BY_ID: (id: string) => `/transactions/${id}`,

  // Category endpoints
  CATEGORIES: "/categories",
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,

  // Saving Targets endpoints
  SAVING_TARGETS: "/savings-goals",
  SAVING_TARGET_BY_ID: (id: string) => `/savings-goals/${id}`,

  // Wallet endpoints
  WALLET_BALANCE: "/wallet/balance",
  WALLET_INCOME: "/wallet/income",

  // AI endpoints
  AI_CHAT: "/ai/chat",
};
