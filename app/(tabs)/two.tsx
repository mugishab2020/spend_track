import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
import { useSavingTargets } from "@/context/SavingTargetsContext";
import { useCategories } from "@/context/CategoriesContext";
import { triggerAIBudgetDistribution } from "@/utils/aiBudget";
import { useNotifications } from "@/context/NotificationsContext";
import { useTheme } from "@/context/ThemeContext";
import { useTransactions } from "@/context/TransactionsContext";
import { apiClient } from "@/services/api";
import { PayWithFlutterwave } from "flutterwave-react-native";
import { buildFlwOptions } from "@/services/flutterwave.service";
type FlwOptions = Parameters<typeof PayWithFlutterwave>[0]["options"];
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
  const { categories, createCategory, updateCategory, deleteCategory, isLoading, loadCategories } = useCategories();
  const { savingTargets } = useSavingTargets();
  const { transactions, refreshTransactions } = useTransactions();
  const [aiEnabled, setAiEnabled] = React.useState<boolean>(false);
  const [aiChecking, setAiChecking] = React.useState<boolean>(false);
  const currency = user?.currency || "RWF";

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("tag");
  const [saving, setSaving] = useState(false);
  const [paySheetVisible, setPaySheetVisible] = useState(false);
  const [payingCat, setPayingCat] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDescription, setPayDescription] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payMode, setPayMode] = useState<"manual" | "flutterwave">("manual");
  const [flwOptions, setFlwOptions] = useState<FlwOptions | null>(null);

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

  const openPay = (cat: any) => {
    setPayingCat(cat);
    setPayAmount("");
    setPayDescription("");
    setPaySheetVisible(true);
  };

  // Check AI status: enabled when there are category updates or income increases since last AI run
  React.useEffect(() => {
    let mounted = true;
    const check = async () => {
      setAiChecking(true);
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const ai = (await import("@/services/ai.service")).aiService;
        const res = await ai.status(month, year);
        const upToDate = res?.data?.upToDate ?? res?.upToDate ?? false;
        // enable AI button when NOT upToDate (i.e., there are changes)
        if (mounted) setAiEnabled(!upToDate);
      } catch (e) {
        if (mounted) setAiEnabled(true);
      } finally {
        if (mounted) setAiChecking(false);
      }
    };

    check();

    return () => { mounted = false; };
  }, [categories, transactions]);

  const handleLongPress = (cat: any) => {
    const isSavings = (cat.name || "").toLowerCase() === "savings" || cat.type === "savings";
    if (isSavings) return; // Do nothing for Savings

    Alert.alert(
      "Delete category",
      `Delete "${cat.name}"? This will remove the category. Transactions will remain uncategorized.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(cat.id);
              try { await loadCategories(); } catch {}
              Alert.alert("Deleted", `Category \"${cat.name}\" deleted.`);
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to delete category");
            }
          },
        },
      ],
    );
  };

  const prepareFlw = () => {
    const parsed = parseFloat(payAmount);
    if (!payAmount.trim() || isNaN(parsed) || parsed <= 0) {
      Alert.alert("Error", "Please enter a valid amount first"); return;
    }
    setFlwOptions(buildFlwOptions({
      amount: parsed,
      currency,
      customerEmail: user?.email || "user@spendtrack.app",
      customerName: user?.full_name || "User",
      description: `Expense: ${payingCat?.name}${payDescription ? " — " + payDescription : ""}`,
      type: "expense",
    }) as FlwOptions);
  };

  const handlePay = async () => {
    const parsed = parseFloat(payAmount);
    if (!payAmount.trim() || isNaN(parsed) || parsed <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    setPaySubmitting(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      await apiClient.post("/transactions", {
        amount: parsed,
        type: "expense",
        category_id: payingCat.id,
        category: payingCat.name,
        description: payDescription.trim() || undefined,
        month,
        year,
        source: "manual",
        status: "completed",
      });
      // Refresh UI
      try { await loadCategories(); } catch {}
      try { await refreshTransactions(); } catch {}
      setPaySheetVisible(false);
      Alert.alert("✅ Recorded", `Expense of ${formatCurrency(parsed, currency)} recorded.`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to record expense");
    } finally {
      setPaySubmitting(false);
    }
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
    const isSavings = (item.name || "").toLowerCase() === "savings" || item.type === "savings";
    // Determine saving goal amount: prefer explicit saving target from context, otherwise
    // try common user-exposed fields (handled elsewhere) — but here we only have
    // savingTargets available from context.
        const ctxGoal = savingTargets[0];
        const userGoalAmount = (user as any)?.savings_target_value ?? (user as any)?.savings_target_amount ?? (user as any)?.savings_target?.targetAmount ?? 0;
        const goalAmount = (item.cap_amount && item.cap_amount > 0) ? item.cap_amount : (ctxGoal?.targetAmount ?? userGoalAmount ?? 0);
        const goalSaved = ctxGoal?.currentSaved ?? null;
    const style = CAT_STYLE[item.name] || { icon: item.icon || "tag", bg: "#F1F5F9", fg: "#64748B" };
    const barColor = isOver ? ERROR : isHigh ? "#F59E0B" : PRIMARY;

    return (
      <Pressable
        onPress={() => {
          const isSavings = (item.name || "").toLowerCase() === "savings" || item.type === "savings";
          if (!isSavings) openPay(item);
        }}
        onLongPress={() => handleLongPress(item)}
      >
        <View style={s.card}>
        <View style={s.cardTop}>
          <View style={s.cardLeft}>
            <View style={[s.iconBox, { backgroundColor: style.bg }]}>
              <FontAwesome name={style.icon as any} size={22} color={style.fg} />
            </View>
            <View>
              <Text style={s.catName}>{item.name}</Text>
              {isSavings ? (
                <View style={s.metaRow}>
                  <Text style={[s.metaSpent, { color: PRIMARY }]}> 
                    {goalAmount && goalAmount > 0 ? `Goal: ${formatCurrency(goalAmount, currency)}` : formatCurrency(spent, currency)}
                  </Text>
                        {goalSaved != null && goalAmount > 0 && (
                    <>
                      <Text style={s.metaDot}>•</Text>
                            <Text style={[s.metaStatus, { color: ON_SURFACE_VARIANT }]}>{goalSaved ? `${Math.round((goalSaved / goalAmount) * 100)}%` : "0%"}</Text>
                    </>
                  )}
                </View>
              ) : cap && cap > 0 ? (
                <View style={s.metaRow}>
                  <Text style={[s.metaSpent, { color: isOver ? ERROR : PRIMARY }]}> 
                    {formatCurrency(spent, currency)} / {formatCurrency(cap, currency)}
                  </Text>
                  <Text style={s.metaDot}>•</Text>
                  <Text style={[s.metaStatus, { color: isOver ? ERROR : isHigh ? "#F59E0B" : ON_SURFACE_VARIANT }]}> 
                    {isOver ? "EXCEEDED" : (pct === 0 ? "0% USED" : `${pct.toFixed(0)}% USED`)}
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
        {cap && cap > 0 && !isSavings && (
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
          </View>
        )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <TopBar title="Categories" />

      <View style={s.headerRow}>
        <View style={s.headerLeftBlock}>
          <Text style={s.headerTitle}>Manage your monthly budgets</Text>
          <Text style={s.headerSubtitle}>Set limits to control spending and reach your savings goals</Text>
        </View>

        <View style={s.headerActions}>
          <Pressable
            accessibilityLabel="Pig Box AI Distribute"
            style={[s.combinedBtn, !aiEnabled && s.combinedBtnDisabled]}
            onPress={() => triggerAIBudgetDistribution(loadCategories)}
            disabled={!aiEnabled}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <MaterialCommunityIcons name="piggy-bank" size={16} color={ON_PRIMARY} />
              <MaterialCommunityIcons name="cube-outline" size={12} color={ON_PRIMARY} style={{ marginLeft: 4 }} />
            </View>
            <Text style={s.combinedText}>{aiChecking ? 'Checking...' : 'AI Distribute'}</Text>
          </Pressable>
        </View>
      </View>

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

      {/* Quick Pay sheet */}
      <Modal visible={paySheetVisible} animationType="slide" transparent onRequestClose={() => setPaySheetVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.overlay}>
          <Pressable style={s.backdrop} onPress={() => setPaySheetVisible(false)} />
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.sheet}>
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>Quick Spend — {payingCat?.name}</Text>

              <Text style={s.fieldLabel}>AMOUNT ({currency})</Text>
              <TextInput
                value={payAmount}
                onChangeText={setPayAmount}
                placeholder="0.00"
                placeholderTextColor={OUTLINE}
                keyboardType="decimal-pad"
                style={s.input}
                autoFocus
              />

              <Text style={s.fieldLabel}>DESCRIPTION (optional)</Text>
              <TextInput
                value={payDescription}
                onChangeText={setPayDescription}
                placeholder="e.g. Coffee"
                placeholderTextColor={OUTLINE}
                style={s.input}
              />

              <Text style={s.fieldLabel}>PAYMENT METHOD</Text>
              <View style={s.modeToggle}>
                <Pressable style={[s.modeBtn, payMode === "manual" && s.modeBtnActive]} onPress={() => setPayMode("manual")}> 
                  <FontAwesome name="pencil" size={14} color={payMode === "manual" ? PRIMARY : ON_SURFACE_VARIANT} style={{ marginRight: 6 }} />
                  <Text style={[s.modeBtnText, payMode === "manual" && { color: PRIMARY }]}>Manual</Text>
                </Pressable>
                <Pressable style={[s.modeBtn, payMode === "flutterwave" && s.modeBtnActive]} onPress={() => setPayMode("flutterwave")}>
                  <FontAwesome name="credit-card" size={14} color={payMode === "flutterwave" ? PRIMARY : ON_SURFACE_VARIANT} style={{ marginRight: 6 }} />
                  <Text style={[s.modeBtnText, payMode === "flutterwave" && { color: PRIMARY }]}>Flutterwave</Text>
                </Pressable>
              </View>

              {/* Submit / Flutterwave */}
              {payMode === "manual" ? (
                <View style={s.sheetBtns}>
                  <Pressable style={s.cancelBtn} onPress={() => setPaySheetVisible(false)} disabled={paySubmitting}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={s.confirmBtn} onPress={handlePay} disabled={paySubmitting}>
                    {paySubmitting ? <ActivityIndicator color={ON_PRIMARY} size="small" /> : <Text style={s.confirmBtnText}>Pay</Text>}
                  </Pressable>
                </View>
              ) : flwOptions ? (
                <PayWithFlutterwave
                  onRedirect={async (data: any) => {
                    if (data.status === "successful" && data.transaction_id) {
                      setPaySubmitting(true);
                      try {
                        const now = new Date();
                        const month = now.getMonth() + 1;
                        const year = now.getFullYear();
                        await apiClient.post("/payments/verify", {
                          transaction_id: data.transaction_id,
                          tx_ref: data.tx_ref,
                          payment_type: "expense",
                          category_id: payingCat?.id,
                          category: payingCat?.name,
                          month, year,
                          description: payDescription.trim() || undefined,
                        });
                        await loadCategories();
                        await refreshTransactions();
                        setPaySheetVisible(false);
                        Alert.alert("✅ Payment recorded", `${formatCurrency(flwOptions.amount as number, currency)} expense recorded via Flutterwave.`);
                      } catch (e: any) {
                        Alert.alert("Error", e.message || "Failed to verify payment");
                      } finally { setPaySubmitting(false); setFlwOptions(null); }
                    } else { setFlwOptions(null); }
                  }}
                  options={flwOptions as FlwOptions}
                  customButton={(props) => (
                    <Pressable style={[s.submitBtn, { backgroundColor: PRIMARY }]} onPress={props.onPress} disabled={paySubmitting}>
                      {paySubmitting ? <ActivityIndicator color={ON_PRIMARY} size="small" /> : <Text style={s.submitBtnText}>Complete payment</Text>}
                    </Pressable>
                  )}
                />
              ) : (
                <Pressable style={[s.submitBtn, { backgroundColor: PRIMARY }]} onPress={prepareFlw} disabled={paySubmitting}>
                  {paySubmitting ? <ActivityIndicator color={ON_PRIMARY} size="small" /> : <Text style={s.submitBtnText}>Pay via Flutterwave</Text>}
                </Pressable>
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SURFACE },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginLeft: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  aiBtnText: { color: ON_PRIMARY, fontWeight: '700' },
  pigBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginLeft: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  headerLeftBlock: { flex: 1, paddingRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: ON_SURFACE, marginBottom: 2 },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: ON_SURFACE_VARIANT },
  headerActions: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', zIndex: 10 },
  combinedBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  combinedBtnDisabled: { opacity: 0.5, backgroundColor: '#9CA9A4' },
  combinedText: { color: ON_PRIMARY, fontWeight: '800', fontSize: 15 },
  combinedSubText: { color: ON_PRIMARY, fontWeight: '700', fontSize: 13 },
  pigBtnText: { color: ON_PRIMARY, fontWeight: '800', fontSize: 14 },
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
  modeToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: SURFACE_CONTAINER_HIGH, marginRight: 8 },
  modeBtnActive: { borderWidth: 1, borderColor: PRIMARY, backgroundColor: SURFACE_LOWEST },
  modeBtnText: { fontSize: 14, fontWeight: '700' },
  submitBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', width: '100%' },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: ON_PRIMARY },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: SURFACE_CONTAINER_HIGH, alignItems: "center" },
  cancelBtnText: { fontSize: 16, fontWeight: "600", color: ON_SURFACE_VARIANT },
  confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: PRIMARY, alignItems: "center" },
  confirmBtnText: { fontSize: 16, fontWeight: "600", color: ON_PRIMARY },
});
