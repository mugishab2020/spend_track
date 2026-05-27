import * as Device from "expo-device";
import { Platform } from "react-native";
import type { NotificationType } from "@/context/NotificationsContext";

let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
} catch (e) {
  console.warn("expo-notifications module not available in this environment.");
}

// Injected by the app on mount so the service can write to the context
let _addNotification: ((type: NotificationType, title: string, body: string) => void) | null = null;

export function injectNotificationStore(
  fn: (type: NotificationType, title: string, body: string) => void
) {
  _addNotification = fn;
}

function store(type: NotificationType, title: string, body: string) {
  _addNotification?.(type, title, body);
}

// Configure how notifications appear when the app is in foreground
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {}
}

export async function registerForNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice || !Notifications) return null; // simulators don't support push

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("spendtrack", {
        name: "SpendTrack",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return finalStatus;
  } catch (error) {
    console.warn("Could not register for push notifications:", error);
    return null;
  }
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  try {
    if (!Notifications) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: true },
      trigger: null, // fire immediately
    });
  } catch (error) {
    console.warn("Failed to send local notification:", error);
  }
}

// ── Notification helpers ──────────────────────────────────────────────────────

export function notifyIncomeRecorded(amount: string, source: string) {
  const title = "💰 Income Recorded";
  const body = `${amount} from ${source} has been added to your wallet.`;
  store("income", title, body);
  sendLocalNotification(title, body);
}

export function notifyCategoryWarning(categoryName: string, percentage: number) {
  if (percentage >= 100) {
    const title = "🚨 Budget Limit Reached";
    const body = `You've used 100% of your ${categoryName} budget. No more spending allowed in this category.`;
    store("budget_exhausted", title, body);
    sendLocalNotification(title, body);
  } else {
    const title = "⚠️ Budget Warning";
    const body = `You're at ${percentage.toFixed(0)}% of your ${categoryName} budget. Slow down to stay on track.`;
    store("budget_warning", title, body);
    sendLocalNotification(title, body);
  }
}

export function notifySavingTargetAtRisk(
  currentSaved: string,
  targetAmount: string,
  percentage: number
) {
  if (percentage <= 0) {
    const title = "🎯 Saving Target Set";
    const body = `Your monthly saving goal is ${targetAmount}. Keep your spending in check!`;
    store("saving_risk", title, body);
    sendLocalNotification(title, body);
  } else if (percentage < 50) {
    const title = "📉 Saving Target at Risk";
    const body = `You've only saved ${currentSaved} of your ${targetAmount} goal (${percentage.toFixed(0)}%). Consider cutting back on expenses.`;
    store("saving_risk", title, body);
    sendLocalNotification(title, body);
  }
}

export function notifySavingGoalAchieved(amount: string) {
  const title = "🎉 Saving Goal Achieved!";
  const body = `Amazing! You've reached your monthly saving goal of ${amount}. Keep it up!`;
  store("saving_achieved", title, body);
  sendLocalNotification(title, body);
}

export function notifyAiPlanApplied() {
  const title = "🤖 AI Plan Applied";
  const body = "Your category budgets have been updated based on the AI recommendations.";
  store("ai_plan", title, body);
  sendLocalNotification(title, body);
}
