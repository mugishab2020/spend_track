import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";

export type ThemeType = "light" | "dark" | "system";

export type CurrencyType =
  | "RWF"
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
  background: "#f6faf7", // surface
  surface: "#ebefec", // surface-container
  card: "#f1f4f2", // surface-container-low
  text: "#181d1b", // on-surface
  textSecondary: "#3e4946", // on-surface-variant
  textTertiary: "#6e7a76", // outline
  border: "#bdc9c4", // outline-variant
  borderLight: "#dfe3e1", // surface-variant
  primary: "#006859", // primary
  primaryLight: "#9af3de", // primary-fixed
  success: "#006c49", // secondary
  warning: "#8f4736", // tertiary
  error: "#ba1a1a", // error
  chartIncome: "#006c49", // secondary
  chartExpense: "#ba1a1a", // error
  chartCategories: [
    "#006859", // primary
    "#006c49", // secondary
    "#8f4736", // tertiary
    "#228271", // primary-container
    "#6cf8bb", // secondary-container
    "#ad5f4d", // tertiary-container
  ],
};

const darkTheme: ThemeColors = {
  background: "#020E1E",
  surface: "#0B1F3F",
  card: "#103456",
  text: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textTertiary: "#94A3B8",
  border: "#334155",
  borderLight: "#2A4A7A",
  primary: "#22C55E",
  primaryLight: "#4ADE80",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#e2b4b4ff",
  chartIncome: "#10B981",
  chartExpense: "#b6e5caff",
  chartCategories: [
    "#22C55E",
    "#16A34A",
    "#15803D",
    "#166534",
    "#14532D",
    "#0F766E",
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
            "RWF",
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
