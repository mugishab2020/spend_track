import FontAwesome from "@expo/vector-icons/FontAwesome";
import TopBar from "@/components/TopBar";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { useCategories } from "@/context/CategoriesContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useTheme } from "@/context/ThemeContext";
import { useTransactions } from "@/context/TransactionsContext";
import { formatCurrency } from "@/utils/money";

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#006859";
const ON_PRIMARY = "#ffffff";
const SECONDARY = "#006c49";
const SECONDARY_CONTAINER = "#6cf8bb";
const ON_SECONDARY_CONTAINER = "#00714d";
const SURFACE = "#f6faf7";
const SURFACE_CONTAINER_LOW = "#f1f4f2";
const SURFACE_CONTAINER_HIGH = "#e5e9e6";
const SURFACE_LOWEST = "#ffffff";
const ON_SURFACE = "#181d1b";
const ON_SURFACE_VARIANT = "#3e4946";
const OUTLINE = "#6e7a76";
const OUTLINE_VARIANT = "#bdc9c4";
const ERROR = "#ba1a1a";

// Icon + color per category name
const CAT_STYLE: Record<string, { icon: string; bg: string; fg: string }> = {
  "Food & Dining":   { icon: "cutlery",       bg: "#FDE8E8", fg: "#E02424" },
  Transport:         { icon: "bus",            bg: "#E1EFFE", fg: "#1C64F2" },
  "Housing & Bills": { icon: "home",           bg: "#FDF2F2", fg: ERROR },
  Health:            { icon: "heartbeat",      bg: "#EBF5FF", fg: "#2563EB" },
  Shopping:          { icon: "shopping-bag",   bg: "#F0FDF4", fg: "#16A34A" },
  Entertainment:     { icon: "film",           bg: "#FFF7ED", fg: "#EA580C" },
  Education:         { icon: "graduation-cap", bg: "#EFF6FF", fg: "#2563EB" },
  "Personal Care":   { icon: "user",           bg: "#FDF4FF", fg: "#9333EA" },
  Savings:           { icon: "bank",           bg: "#FEF3C7", fg: "#D97706" },
  Other:             { icon: "tag",            bg: "#F1F5F9", fg: "#64748B" },
};

const ICON_OPTIONS = ["cutlery", "bus", "home", "heartbeat", "shopping-bag", "film", "graduation-cap", "user", "bank", "tag", "plane", "music", "coffee", "car", "gift"];

export default function CategoriesScreen() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { categories, createCategory, updateCategory, isLoading } = useCategories();
  const { transactions } = useTransactions();
  const currency = user?.currency || "RWF";

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("tag");
  const [saving, setSaving] = useState(false);

  // Compute spending per category from transactions
  const spending: Record<string, number> = {};
  transactions.filter((t) => t.type === "expense")
    .forEach((t) => { spending[t.category] = (spending[t.category] || 0) + t.amount; });

  const openAdd = () => {
    setEditingCat(null);
    setName(""); setLimit(""); setSelectedIcon("tag");
    setSheetVisible(true);
  };

  const openEdit = (cat: any) => {
    setEditingCat(cat);
    setName(cat.name);
    setLimit(cat.cap_amount != null ? String(cat.cap_amount) : "");
    setSelectedIcon(cat.icon || "tag");
    setSheetVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Category name is required"); return; }
    const cap = limit.trim() ? parseFloat(limit) : null;
    if (limit.trim() && (isNaN(cap!) || cap! <= 0)) { Alert.alert("Error", "Enter a valid limit"); return; }
    setSaving(true);
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, { name: name.trim(), icon: selectedIcon, type: "expense", cap_amount: cap });
      } else {
        await createCategory({ name: name.trim(), icon: selectedIcon, type: "expense", cap_amount: cap });
      }
      setSheetVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const renderCategory = ({ item }: { item: any }) => {
    const spent = spending[item.id] || 0;
    const cap = item.cap_amount;
    const pct = cap && cap > 0 ? Math.min((spent / cap) * 100, 100) : 0;
    const isOver = cap && spent > cap;
    const isHigh = pct >= 80 && !isOver;
    const style = CAT_STYLE[item.name] || { icon: item.icon || "tag", bg: "#F1F5F9", fg: "#64748B" };
    const barColor = isOver ? ERROR : isHigh ? "#F59E0B" : PRIMARY;

    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={s.cardLeft}>
            <View style={[s.iconBox, { backgroundColor: style.bg }]}>
              <FontAwesome name={style.icon as any} size={22} color={style.fg} />
            </View>
            <View>
              <Text style={s.catName}>{item.name}</Text>
              {cap && cap > 0 ? (
                <View style={s.metaRow}>
                  <Text style={[s.metaSpent, { color: isOver ? ERROR : PRIMARY }]}>
                    {spent.toLocaleString()} {currency}
                  </Text>
                  <Text style={s.metaDot}>•</Text>
                  <Text style={[s.metaStatus, { color: isOver ? ERROR : isHigh ? "#F59E0B" : ON_SURFACE_VARIANT }]}>
                    {isOver ? "EXCEEDED" : `${pct.toFixed(0)}% USED`}
                  </Text>
                </View>
              ) : (
                <Text style={s.metaNoLimit}>No spending limit set</Text>
              )}
            </View>
          </View>
          <Pressable style={s.editBtn} onPress={() => openEdit(item)}>
            <FontAwesome name="pencil" size={16} color={OUTLINE} />
          </Pressable>
        </View>
        {cap && cap > 0 && (
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <TopBar title="Categories" />

      <Text style={s.subheader}>Manage your spending limits</Text>

      {isLoading ? (
        <ActivityIndicator color={PRIMARY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <FontAwesome name="inbox" size={48} color={OUTLINE_VARIANT} />
              <Text style={s.emptyTitle}>No categories yet</Text>
              <Text style={s.emptyBody}>Create your first category to start managing your monthly budget.</Text>
              <Pressable style={s.emptyBtn} onPress={openAdd}>
                <FontAwesome name="plus" size={16} color={ON_PRIMARY} style={{ marginRight: 8 }} />
                <Text style={s.emptyBtnText}>Add Category</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Pressable style={s.fab} onPress={openAdd}>
        <FontAwesome name="plus" size={24} color={ON_PRIMARY} />
      </Pressable>

      {/* Bottom sheet */}
      <Modal visible={sheetVisible} animationType="slide" transparent onRequestClose={() => setSheetVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.overlay}>
          <Pressable style={s.backdrop} onPress={() => setSheetVisible(false)} />
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.sheet}>
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>{editingCat ? "Edit Category" : "New Category"}</Text>

              <Text style={s.fieldLabel}>CATEGORY NAME</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Subscriptions"
                placeholderTextColor={OUTLINE}
                autoCapitalize="words"
                style={s.input}
              />

              <Text style={s.fieldLabel}>MONTHLY LIMIT ({currency})</Text>
              <TextInput
                value={limit}
                onChangeText={setLimit}
                placeholder="0 (leave empty for no limit)"
                placeholderTextColor={OUTLINE}
                keyboardType="decimal-pad"
                style={s.input}
              />

              <Text style={s.fieldLabel}>SELECT ICON</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                {ICON_OPTIONS.map((icon) => (
                  <Pressable
                    key={icon}
                    style={[s.iconOption, selectedIcon === icon && s.iconOptionActive]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <FontAwesome name={icon as any} size={20} color={selectedIcon === icon ? ON_PRIMARY : OUTLINE} />
                  </Pressable>
                ))}
              </ScrollView>

              <View style={s.sheetBtns}>
                <Pressable style={s.cancelBtn} onPress={() => setSheetVisible(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={s.confirmBtn} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color={ON_PRIMARY} size="small" /> : <Text style={s.confirmBtnText}>{editingCat ? "Save" : "Create"}</Text>}
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SURFACE },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, backgroundColor: SURFACE_CONTAINER_LOW },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY, justifyContent: "center", alignItems: "center" },
  avatarText: { color: ON_PRIMARY, fontWeight: "700", fontSize: 14 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: ON_SURFACE },
  headerRight: { flexDirection: "row", gap: 4 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", position: "relative" },
  notifDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: ERROR },
  subheader: { fontSize: 16, fontWeight: "600", color: ON_SURFACE_VARIANT, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },

  card: { backgroundColor: SURFACE_LOWEST, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: OUTLINE_VARIANT, marginBottom: 10 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  catName: { fontSize: 17, fontWeight: "700", color: ON_SURFACE, marginBottom: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaSpent: { fontSize: 13, fontWeight: "600" },
  metaDot: { fontSize: 10, color: OUTLINE },
  metaStatus: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  metaNoLimit: { fontSize: 13, fontWeight: "600", color: OUTLINE },
  editBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  barBg: { height: 6, backgroundColor: SURFACE_CONTAINER_HIGH, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },

  fab: { position: "absolute", bottom: 100, right: 20, width: 56, height: 56, borderRadius: 16, backgroundColor: PRIMARY, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },

  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: ON_SURFACE, marginTop: 16, marginBottom: 8 },
  emptyBody: { fontSize: 15, fontWeight: "600", color: ON_SURFACE_VARIANT, textAlign: "center", marginBottom: 24 },
  emptyBtn: { flexDirection: "row", alignItems: "center", backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  emptyBtnText: { fontSize: 16, fontWeight: "600", color: ON_PRIMARY },

  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { backgroundColor: SURFACE, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 48 },
  sheetHandle: { width: 48, height: 6, backgroundColor: OUTLINE_VARIANT, borderRadius: 3, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: "700", color: ON_SURFACE, marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1, color: ON_SURFACE_VARIANT, marginBottom: 8 },
  input: { backgroundColor: SURFACE_CONTAINER_LOW, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: "600", color: ON_SURFACE, marginBottom: 20 },
  iconOption: { width: 48, height: 48, borderRadius: 12, backgroundColor: SURFACE_CONTAINER_HIGH, justifyContent: "center", alignItems: "center", marginRight: 10 },
  iconOptionActive: { backgroundColor: PRIMARY },
  sheetBtns: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: SURFACE_CONTAINER_HIGH, alignItems: "center" },
  cancelBtnText: { fontSize: 16, fontWeight: "600", color: ON_SURFACE_VARIANT },
  confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: PRIMARY, alignItems: "center" },
  confirmBtnText: { fontSize: 16, fontWeight: "600", color: ON_PRIMARY },
});
