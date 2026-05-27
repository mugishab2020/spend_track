import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { registerForNotifications, injectNotificationStore } from "@/services/notifications.service";

import { useColorScheme } from "@/components/useColorScheme";
import { AuthProvider } from "@/context/AuthContext";
import { CategoriesProvider } from "@/context/CategoriesContext";
import { NotificationsProvider, useNotifications } from "@/context/NotificationsContext";
import { SavingTargetsProvider } from "@/context/SavingTargetsContext";
import { ThemeProvider as CustomThemeProvider, useTheme } from "@/context/ThemeContext";
import { TransactionsProvider } from "@/context/TransactionsContext";

function NotificationStoreBridge() {
  const { addNotification } = useNotifications();
  useEffect(() => { injectNotificationStore(addNotification); }, [addNotification]);
  return null;
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      registerForNotifications();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  // light background → dark icons/text, dark background → light icons/text
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <CustomThemeProvider>
      <NotificationsProvider>
        <AuthProvider>
          <CategoriesProvider>
            <SavingTargetsProvider>
              <TransactionsProvider>
                <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                  <ThemedStatusBar />
                  <NotificationStoreBridge />
                  <Stack>
                    <Stack.Screen name="landing" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="register" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="profile" options={{ headerShown: false }} />
                    <Stack.Screen name="notifications" options={{ headerShown: false }} />
                    <Stack.Screen name="ai-chat" options={{ headerShown: false }} />
                    <Stack.Screen name="ai-insights" options={{ headerShown: false }} />
                    <Stack.Screen name="meal-plan" options={{ headerShown: false }} />
                    <Stack.Screen name="transport-plan" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                  </Stack>
                </ThemeProvider>
              </TransactionsProvider>
            </SavingTargetsProvider>
          </CategoriesProvider>
        </AuthProvider>
      </NotificationsProvider>
    </CustomThemeProvider>
  );
}
