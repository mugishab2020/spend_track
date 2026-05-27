import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "./api";
import { sendLocalNotification } from "./notifications.service";
import type { NotificationType } from "@/context/NotificationsContext";

const LAST_DIGEST_KEY = "@spendtrack_last_digest";

function levelToType(level: string): NotificationType {
  if (level === "danger") return "budget_exhausted";
  if (level === "warning") return "budget_warning";
  if (level === "success") return "saving_achieved";
  return "income";
}

export async function runDailyDigestIfNeeded(
  addNotification: (type: NotificationType, title: string, body: string) => void
) {
  try {
    const last = await AsyncStorage.getItem(LAST_DIGEST_KEY);
    const today = new Date().toDateString();

    // Only run once per calendar day
    if (last === today) return;

    const now = new Date();
    const res = await apiClient.get<any>("/ai/daily-digest");
    const digest = res?.data;
    if (!digest?.title) return;

    // Store in-app notification
    addNotification(levelToType(digest.level), digest.title, digest.body);

    // Fire system notification
    await sendLocalNotification(digest.title, digest.body);

    // Mark today as done
    await AsyncStorage.setItem(LAST_DIGEST_KEY, today);
  } catch (e) {
    // Silently fail — digest is best-effort
    console.log("Daily digest skipped:", e);
  }
}
