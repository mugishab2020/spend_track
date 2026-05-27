import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { apiClient } from "@/services/api";
import { formatCurrency } from "@/utils/money";
import { useTransactions } from "@/context/TransactionsContext";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY"];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, refreshUser, logout } = useAuth();
  const { totals } = useTransactions();
  useProtectedRoute();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [address, setAddress] = useState(user?.address || "");
  const [currency, setCurrency] = useState(user?.currency || "USD");

  const openEdit = () => {
    setFullName(user?.full_name || "");
    setPhone(user?.phone_number || "");
    setAddress(user?.address || "");
    setCurrency(user?.currency || "USD");
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert("Error", "Name is required"); return; }
    setSaving(true);
    try {
      await apiClient.put("/users/me", {
        full_name: fullName.trim(),
        phone_number: phone.trim() || null,
        address: address.trim() || null,
        currency,
      });
      await refreshUser();
      setEditModalVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const initials = (user?.full_name || user?.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
            <FontAwesome name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <Pressable onPress={openEdit} style={[styles.editBtn, { backgroundColor: colors.surface }]}>
            <FontAwesome name="pencil" size={16} color={colors.primary} />
          </Pressable>
        </View>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.full_name || "—"}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{formatCurrency(totals.income, user?.currency)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Income</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: "#EF4444" }]}>{formatCurrency(totals.expenses, user?.currency)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Spent</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: totals.balance >= 0 ? colors.primary : "#EF4444" }]}>
              {formatCurrency(totals.balance, user?.currency)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Balance</Text>
          </View>
        </View>

        {/* Info section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PERSONAL INFO</Text>
          <InfoRow icon="user" label="Full Name" value={user?.full_name || "—"} colors={colors} />
          <InfoRow icon="envelope" label="Email" value={user?.email || "—"} colors={colors} />
          <InfoRow icon="phone" label="Phone" value={user?.phone_number || "Not set"} colors={colors} />
          <InfoRow icon="map-marker" label="Address" value={user?.address || "Not set"} colors={colors} />
          <InfoRow icon="money" label="Currency" value={user?.currency || "USD"} colors={colors} />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>

          <Pressable
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.primary + "20" }]}>
              <FontAwesome name="cog" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Settings</Text>
            <FontAwesome name="chevron-right" size={14} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/notifications")}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#F59E0B20" }]}>
              <FontAwesome name="bell" size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Notifications</Text>
            <FontAwesome name="chevron-right" size={14} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: "#EF444430" }]}
            onPress={handleLogout}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#EF444420" }]}>
              <FontAwesome name="sign-out" size={16} color="#EF4444" />
            </View>
            <Text style={[styles.menuText, { color: "#EF4444" }]}>Log Out</Text>
            <FontAwesome name="chevron-right" size={14} color="#EF4444" />
          </Pressable>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.overlay}>
              <View style={[styles.sheet, { backgroundColor: colors.card }]}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Edit Profile</Text>

                <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={[styles.label, { color: colors.text }]}>Phone (optional)</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="e.g. +1 555 000 0000"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                />

                <Text style={[styles.label, { color: colors.text }]}>Address (optional)</Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="e.g. 123 Main St"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                />

                <Text style={[styles.label, { color: colors.text }]}>Currency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {CURRENCIES.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setCurrency(c)}
                      style={[
                        styles.currencyChip,
                        { borderColor: currency === c ? colors.primary : colors.border,
                          backgroundColor: currency === c ? colors.primary : colors.surface },
                      ]}
                    >
                      <Text style={{ color: currency === c ? "#fff" : colors.text, fontWeight: "600", fontSize: 13 }}>{c}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={styles.modalButtons}>
                  <Pressable style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setEditModalVisible(false)}>
                    <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmBtnText}>Save</Text>}
                  </Pressable>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, colors }: any) {
  return (
    <View style={[styles.infoRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: colors.surface }]}>
        <FontAwesome name={icon} size={14} color={colors.textSecondary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  editBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },

  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  initials: { fontSize: 32, fontWeight: "900", color: "#fff" },
  name: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  email: { fontSize: 14 },

  statsRow: { flexDirection: "row", marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 24 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, marginHorizontal: 8 },

  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },

  infoRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  infoIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "600" },

  menuItem: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  menuIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center", marginRight: 12 },
  menuText: { flex: 1, fontSize: 15, fontWeight: "600" },

  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  sheetTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16 },
  currencyChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { fontSize: 16, fontWeight: "600" },
  confirmBtnText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
