import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={24} color="#111827" />
          </Pressable>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <FontAwesome name="user" size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.name}>John Doe</Text>
          <Text style={styles.email}>john.doe@example.com</Text>
        </View>

        <View style={styles.menuSection}>
          <Pressable style={styles.menuItem}>
            <FontAwesome name="user" size={20} color="#6B7280" />
            <Text style={styles.menuText}>Personal Information</Text>
            <FontAwesome name="chevron-right" size={16} color="#6B7280" />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <FontAwesome name="credit-card" size={20} color="#6B7280" />
            <Text style={styles.menuText}>Payment Methods</Text>
            <FontAwesome name="chevron-right" size={16} color="#6B7280" />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <FontAwesome name="cog" size={20} color="#6B7280" />
            <Text style={styles.menuText}>Settings</Text>
            <FontAwesome name="chevron-right" size={16} color="#6B7280" />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <FontAwesome name="sign-out" size={20} color="#6B7280" />
            <Text style={styles.menuText}>Logout</Text>
            <FontAwesome name="chevron-right" size={16} color="#6B7280" />
          </Pressable>
        </View>
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
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#6B7280",
  },
  menuSection: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 8,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 12,
  },
});
