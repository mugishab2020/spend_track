import React, { createContext, useContext, useState, useEffect } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeType = "light" | "dark" | "system";

export type CurrencyType =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CHF"
  | "CNY"
  | "SEK"
  | "NZD";

export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  card: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Border colors
  border: string;
  borderLight: string;

  // Primary colors
  primary: string;
  primaryLight: string;

  // Status colors
  success: string;
  warning: string;
  error: string;

  // Chart colors
  chartIncome: string;
  chartExpense: string;
  chartCategories: string[];
}

const lightTheme: ThemeColors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  primary: "#3B82F6",
  primaryLight: "#EBF4FF",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  chartIncome: "#10B981",
  chartExpense: "#EF4444",
  chartCategories: [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
  ],
};

const darkTheme: ThemeColors = {
  background: "#0F172A",
  surface: "#1E293B",
  card: "#334155",
  text: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textTertiary: "#94A3B8",
  border: "#334155",
  borderLight: "#475569",
  primary: "#3B82F6",
  primaryLight: "#1E40AF",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  chartIncome: "#10B981",
  chartExpense: "#EF4444",
  chartCategories: [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
  ],
};

type ThemeContextType = {
  theme: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = "@spendtrack_theme";
const CURRENCY_STORAGE_KEY = "@spendtrack_currency";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>("system");
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );
  const [currency, setCurrencyState] = useState<CurrencyType>("USD");

  // Load saved theme and currency on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
          setThemeState(savedTheme as ThemeType);
        }
        const savedCurrency = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
        if (
          savedCurrency &&
          [
            "USD",
            "EUR",
            "GBP",
            "JPY",
            "CAD",
            "AUD",
            "CHF",
            "CNY",
            "SEK",
            "NZD",
          ].includes(savedCurrency)
        ) {
          setCurrencyState(savedCurrency as CurrencyType);
        }
      } catch (error) {
        console.error("Failed to load theme or currency:", error);
      }
    };
    loadTheme();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const setCurrency = async (newCurrency: CurrencyType) => {
    setCurrencyState(newCurrency);
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    } catch (error) {
      console.error("Failed to save currency:", error);
    }
  };

  const getCurrentColors = (): ThemeColors => {
    if (theme === "system") {
      return systemTheme === "dark" ? darkTheme : lightTheme;
    }
    return theme === "dark" ? darkTheme : lightTheme;
  };

  const colors = getCurrentColors();
  const isDark = colors === darkTheme;

  return (
    <ThemeContext.Provider
      value={{ theme, colors, setTheme, isDark, currency, setCurrency }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
