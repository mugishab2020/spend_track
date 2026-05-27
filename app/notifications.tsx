import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNotifications, type AppNotification } from "@/context/NotificationsContext";

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#006859";
const ERROR = "#ba1a1a";
const SURFACE = "#f6faf7";
const SURFACE_LOWEST = "#ffffff";
const SURFACE_CONTAINER_LOW = "#f1f4f2";
const ON_SURFACE = "#181d1b";
const ON_SURFACE_VARIANT = "#3e4946";
const OUTLINE_VARIANT = "#bdc9c4";

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  income:           { icon: "dollar",              color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  budget_warning:   { icon: "exclamation-triangle", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  budget_exhausted: { icon: "ban",                 color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  saving_risk:      { icon: "line-chart",           color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  saving_achieved:  { icon: "trophy",              color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
  ai_plan:          { icon: "robot",               color: PRIMARY,   bg: "rgba(0,104,89,0.15)" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function groupByDay(notifications: AppNotification[]) {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  const groups: { label: string; items: AppNotification[] }[] = [];
  const map: Record<string, AppNotification[]> = {};

  for (const n of notifications) {
    const d = new Date(n.createdAt).toDateString();
    const label = d === today ? "TODAY" : d === yesterday ? "YESTERDAY" : "EARLIER";
    if (!map[label]) { map[label] = []; groups.push({ label, items: map[label] }); }
    map[label].push(n);
  }
  return groups;
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications();
  const groups = groupByDay(notifications);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow1}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <FontAwesome name="arrow-left" size={20} color={PRIMARY} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={s.headerSub}>{unreadCount} unread</Text>
            )}
          </View>
        </View>
        {notifications.length > 0 && (
          <View style={s.headerActions}>
            {unreadCount > 0 && (
              <Pressable style={[s.actionBtn, { backgroundColor: "rgba(0,104,89,0.08)" }]} onPress={markAllRead}>
                <Text style={[s.actionText, { color: PRIMARY }]}>Mark all read</Text>
              </Pressable>
            )}
            <Pressable style={[s.actionBtn, { backgroundColor: "rgba(186,26,26,0.08)" }]} onPress={clearAll}>
              <FontAwesome name="trash" size={12} color={ERROR} style={{ marginRight: 4 }} />
              <Text style={[s.actionText, { color: ERROR }]}>Clear all</Text>
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {groups.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyCircle}>
              <FontAwesome name="bell-slash" size={40} color={PRIMARY} style={{ opacity: 0.3 }} />
            </View>
            <Text style={s.emptyText}>Keeping you on track with your financial goals.</Text>
          </View>
        ) : (
          groups.map(({ label, items }) => (
            <View key={label} style={s.group}>
              <Text style={s.groupLabel}>{label}</Text>
              {items.map((item) => {
                const cfg = TYPE_CONFIG[item.type] ?? { icon: "bell", color: PRIMARY, bg: "rgba(0,104,89,0.12)" };
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      s.card,
                      !item.read && { borderLeftWidth: 3, borderLeftColor: cfg.color },
                    ]}
                    onPress={() => markRead(item.id)}
                  >
                    <View style={[s.iconCircle, { backgroundColor: cfg.bg }]}>
                      <FontAwesome name={cfg.icon as any} size={20} color={cfg.color} />
                    </View>
                    <View style={s.cardContent}>
                      <View style={s.cardTop}>
                        <View style={s.cardTitleRow}>
                          <Text style={s.cardTitle}>{item.title}</Text>
                          {!item.read && <View style={s.unreadDot} />}
                        </View>
                        <Text style={[s.cardTime, { color: item.read ? ON_SURFACE_VARIANT : PRIMARY }]}>
                          {timeAgo(item.createdAt)}
                        </Text>
                      </View>
                      <Text style={s.cardBody}>{item.body}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}

        {/* Decorative illustration */}
        {notifications.length > 0 && (
          <View style={s.illustration}>
            <View style={s.illustrationCircle}>
              <View style={s.figureBody} />
              <View style={s.figureHead} />
            </View>
            <Text style={s.illustrationText}>Keeping you on track with your financial goals.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SURFACE },

  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: SURFACE, borderBottomWidth: 1, borderBottomColor: OUTLINE_VARIANT,
    gap: 10,
  },
  headerRow1: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: PRIMARY },
  headerSub: { fontSize: 13, fontWeight: "600", color: ON_SURFACE_VARIANT, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 8, paddingLeft: 50 },
  actionBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  actionText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },

  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  group: { marginBottom: 20 },
  groupLabel: {
    fontSize: 12, fontWeight: "800", letterSpacing: 1,
    color: ON_SURFACE_VARIANT, opacity: 0.7,
    marginBottom: 10, paddingHorizontal: 4,
  },

  card: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    backgroundColor: SURFACE_LOWEST, borderRadius: 12,
    borderWidth: 1, borderColor: OUTLINE_VARIANT,
    padding: 14, marginBottom: 8,
  },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: ON_SURFACE, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },
  cardTime: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3, marginLeft: 8 },
  cardBody: { fontSize: 13, fontWeight: "600", color: ON_SURFACE_VARIANT, lineHeight: 19 },

  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(0,104,89,0.08)", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyText: { fontSize: 14, fontWeight: "600", color: ON_SURFACE_VARIANT, textAlign: "center", maxWidth: 220 },

  illustration: { alignItems: "center", marginTop: 32, opacity: 0.4 },
  illustrationCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(34,130,113,0.15)",
    justifyContent: "flex-end", alignItems: "center",
    overflow: "hidden", marginBottom: 12,
  },
  figureBody: { width: 40, height: 56, backgroundColor: PRIMARY, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  figureHead: { position: "absolute", top: 12, width: 24, height: 24, borderRadius: 12, backgroundColor: PRIMARY },
  illustrationText: { fontSize: 13, fontWeight: "600", color: ON_SURFACE_VARIANT, textAlign: "center", maxWidth: 200 },
});
