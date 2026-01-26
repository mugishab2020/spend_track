import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "budget" | "transaction" | "goal" | "system";
}

const dummyNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Budget Alert",
    message: "You've spent 80% of your Food budget this month",
    time: "2 hours ago",
    read: false,
    type: "budget",
  },
  {
    id: "2",
    title: "Savings Goal Achieved!",
    message: "Congratulations! You reached your monthly savings goal",
    time: "1 day ago",
    read: false,
    type: "goal",
  },
  {
    id: "3",
    title: "New Transaction",
    message: "You received $500 from Salary",
    time: "2 days ago",
    read: true,
    type: "transaction",
  },
  {
    id: "4",
    title: "Weekly Summary",
    message: "Your spending this week is 15% lower than last week",
    time: "3 days ago",
    read: true,
    type: "system",
  },
  {
    id: "5",
    title: "Budget Exceeded",
    message: "Entertainment budget exceeded by $50",
    time: "5 days ago",
    read: true,
    type: "budget",
  },
];

function NotificationItemComponent({ item }: { item: NotificationItem }) {
  const getIconName = (type: string) => {
    switch (type) {
      case "budget":
        return "exclamation-triangle";
      case "transaction":
        return "dollar";
      case "goal":
        return "trophy";
      case "system":
        return "info-circle";
      default:
        return "bell";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "budget":
        return "#EF4444";
      case "transaction":
        return "#10B981";
      case "goal":
        return "#F59E0B";
      case "system":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  return (
    <Pressable
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getIconColor(item.type) },
        ]}
      >
        <FontAwesome name={getIconName(item.type)} size={16} color="#FFFFFF" />
      </View>
      <View style={styles.notificationContent}>
        <Text
          style={[styles.notificationTitle, !item.read && styles.unreadText]}
        >
          {item.title}
        </Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={24} color="#111827" />
          </Pressable>
          <Pressable style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        </View>

        <FlatList
          data={dummyNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItemComponent item={item} />}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="bell-slash" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyMessage}>You're all caught up!</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
  notificationsList: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 8,
  },
  unreadItem: {
    backgroundColor: "#EEF2FF",
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: "700",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
