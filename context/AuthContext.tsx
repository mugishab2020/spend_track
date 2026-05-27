import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { ApiError } from "../services/api";
import {
  authService,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../services/auth.service";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  socialLogin: (provider: "google" | "apple", data: { email: string; full_name: string; social_id: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log(" Checking authentication status...");

    try {
      const isAuth = await authService.isAuthenticated();
      console.log("  Has token:", isAuth);

      if (isAuth) {
        console.log("  Fetching user profile...");
        const currentUser = await authService.getCurrentUser();
        console.log("  User loaded:", currentUser.email || currentUser.id);
        setUser(currentUser);
      } else {
        console.log("  No token found");
      }
    } catch (error: any) {
      console.error(" Auth check failed:", error);

      // If token is invalid (401), clear it
      if (error instanceof ApiError && error.status === 401) {
        console.log("  Token invalid, clearing stored token");
        await SecureStore.deleteItemAsync("auth_token");
      }

      setUser(null);
    } finally {
      setIsLoading(false);
      console.log("  Auth check complete");
    }
  };

  const login = async (credentials: LoginCredentials) => {
    console.log("\n Login process starting...");
    setIsLoading(true);

    try {
      const response = await authService.login(credentials);
      console.log("  Token stored, fetching user profile...");
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      console.log(" Login process complete");
    } catch (error) {
      console.error("Login process failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log("\n🚪 Logout process starting...");
    setIsLoading(true);

    try {
      await authService.logout();
      setUser(null);
      console.log("Logout complete");
    } catch (error) {
      console.error(" Logout failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    console.log("\n Register process starting...");
    setIsLoading(true);

    try {
      await authService.register(credentials);
      console.log("  Token stored, fetching user profile...");
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      console.log("Register process complete");
    } catch (error) {
      console.error(" Register process failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (provider: "google" | "apple", data: { email: string; full_name: string; social_id: string }) => {
    console.log(`\n🌐 ${provider} Login process starting...`);
    setIsLoading(true);

    try {
      await authService.socialLogin(provider, data);
      console.log("  Token stored, fetching user profile...");
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      console.log(` ${provider} login complete`);
    } catch (error) {
      console.error(` ${provider} login failed:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        socialLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
