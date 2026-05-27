import FontAwesome from "@expo/vector-icons/FontAwesome";
import TopBar from "@/components/TopBar";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
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
import { useTransactions } from "@/context/TransactionsContext";
import { useSavingTargets } from "@/context/SavingTargetsContext";
import { apiClient } from "@/services/api";
import { buildFlwOptions, FlwRedirectParams } from "@/services/flutterwave.service";
import { notifyIncomeRecorded } from "@/services/notifications.service";
import { formatCurrency } from "@/utils/money";
import { PayWithFlutterwave } from "flutterwave-react-native";
type FlwOptions = Parameters<typeof PayWithFlutterwave>[0]["options"];

// ── Design tokens ─────────────────────────────────────────────────────────────
const NAVY = "#103456";
const PRIMARY = "#006859";
const ON_PRIMARY = "#ffffff";
const SECONDARY = "#006c49";
const SECONDARY_FIXED = "#6ffbbe";
const SECONDARY_FIXED_DIM = "#4edea3";
const SECONDARY_CONTAINER = "#6cf8bb";
const ON_SECONDARY_CONTAINER = "#00714d";
const SURFACE = "#f6faf7";
const SURFACE_CONTAINER_LOW = "#f1f4f2";
const SURFACE_CONTAINER_HIGH = "#e5e9e6";
const SURFACE_CONTAINER_HIGHEST = "#dfe3e1";
const ON_SURFACE = "#181d1b";
const ON_SURFACE_VARIANT = "#3e4946";
const OUTLINE = "#6e7a76";
const OUTLINE_VARIANT = "#bdc9c4";
const TERTIARY = "#8f4736";
const TERTIARY_FIXED_DIM = "#ffb4a3";

const INCOME_SOURCES = ["Salary", "Freelance", "Gift", "Investment", "Bonus", "Other"];

const SOURCE_ICONS: Record<string, string> = {
  Salary: "briefcase", Freelance: "laptop", Gift: "gift",
  Investment: "line-chart", Bonus: "star", Other: "question-circle",
};

const SOURCE_COLORS: Record<string, { bg: string; fg: string }> = {
  Salary:     { bg: "rgba(78,222,163,0.2)",  fg: SECONDARY },
  Freelance:  { bg: "rgba(255,180,163,0.2)", fg: TERTIARY },
  Gift:       { bg: "rgba(78,222,163,0.2)",  fg: SECONDARY },
  Investment: { bg: "rgba(78,222,163,0.2)",  fg: SECONDARY },
  Bonus:      { bg: "rgba(255,180,163,0.2)", fg: TERTIARY },
  Other:      { bg: "rgba(78,222,163,0.2)",  fg: SECONDARY },
};

interface IncomeRecord {
  id: string; amount: number; month: number; year: number;
  source: string; description?: string; created_at: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function WalletScreen() {
  const { user } = useAuth();
  const { totals, refreshTransactions } = useTransactions();
  const { savingTargets } = useSavingTargets();
  const currency = user?.currency || "RWF";

  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [incomeMode, setIncomeMode] = useState<"manual" | "flutterwave">("manual");
  const [submitting, setSubmitting] = useState(false);
  const [flwOptions, setFlwOptions] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("Salary");
  const [description, setDescription] = useState("");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthLabel = now.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

  const loadIncome = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<any>(`/transactions?type=income&month=${month}&year=${year}&limit=500`);
      const items: any[] = res.data?.items ?? [];
      setIncomeRecords(items.map((r) => ({
        id: r.id, amount: r.amount, month: r.month, year: r.year,
        source: r.category || r.source || "Income",
        description: r.description, created_at: r.created_at,
      })));
    } catch (e: any) { console.error("Failed to load income:", e.message); }
    finally { setIsLoading(false); }
  }, [month, year]);

  useFocusEffect(useCallback(() => { loadIncome(); }, [loadIncome]));

  const monthTotal = incomeRecords.reduce((s, r) => s + r.amount, 0);
  const goal = savingTargets[0];
  const spendable = goal?.targetAmount ? Math.max(0, totals.income - (goal.targetAmount ?? 0)) : totals.balance;

  const handleManualIncome = async () => {
    const parsed = parseFloat(amount);
    if (!amount.trim() || isNaN(parsed) || parsed <= 0) { Alert.alert("Error", "Please enter a valid amount"); return; }
    setSubmitting(true);
    try {
      const res = await apiClient.post<any>("/transactions", {
        amount: parsed, type: "income", category: source,
        description: description.trim() || undefined,
        month, year, source: "manual", status: "completed",
      });
      setIncomeRecords((prev) => [{
        id: res.data.id, amount: res.data.amount, month: res.data.month, year: res.data.year,
        source: res.data.category || source, description: res.data.description, created_at: res.data.created_at,
      }, ...prev]);
      refreshTransactions();
      notifyIncomeRecorded(formatCurrency(parsed, currency), source);
      setAmount(""); setDescription(""); setSource("Salary"); setModalVisible(false);
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to record income"); }
    finally { setSubmitting(false); }
  };

  const preparePayment = () => {
    const parsed = parseFloat(amount);
    if (!amount.trim() || isNaN(parsed) || parsed <= 0) { Alert.alert("Error", "Please enter a valid amount first"); return; }
    setFlwOptions(buildFlwOptions({
      amount: parsed, currency,
      customerEmail: user?.email || "user@spendtrack.app",
      customerName: user?.full_name || "SpendTrack User",
      description: `Income: ${source}${description ? " — " + description : ""}`,
      type: "income",
    }));
  };

  return (
    <SafeAreaView style={s.safe}>
      <TopBar title="Wallet" />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Balance card */}
        <View style={s.balanceCard}>
          <View style={s.balanceBlob} />
          <Text style={s.balanceCaption}>TOTAL BALANCE</Text>
          <View style={s.balanceAmountRow}>
            <Text style={s.balanceCurrency}>{currency}</Text>
            <Text style={s.balanceAmount}>{totals.balance.toLocaleString()}</Text>
          </View>
          <View style={s.balanceDivider} />
          <View style={s.balanceRow}>
            <View>
              <Text style={s.balanceSubCaption}>GOAL</Text>
              <Text style={s.balanceSubVal}>{goal ? (goal.targetAmount ?? 0).toLocaleString() : "—"}</Text>
            </View>
            <View>
              <Text style={s.balanceSubCaption}>SPENDABLE</Text>
              <Text style={[s.balanceSubVal, { color: SECONDARY_FIXED }]}>{spendable.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Add Income button */}
        <Pressable style={s.addBtn} onPress={() => setModalVisible(true)}>
          <FontAwesome name="plus-circle" size={22} color={ON_PRIMARY} style={{ marginRight: 8 }} />
          <Text style={s.addBtnText}>Add Income</Text>
        </Pressable>

        {/* Income history */}
        <View style={s.historyHeader}>
          <View style={s.historyTitleRow}>
            <Text style={s.historyTitle}>Income History</Text>
            <View style={s.monthBadge}>
              <Text style={s.monthBadgeText}>{monthLabel} TOTAL: +{monthTotal.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
        ) : incomeRecords.length === 0 ? (
          <View style={s.empty}>
            <FontAwesome name="inbox" size={40} color={OUTLINE_VARIANT} />
            <Text style={s.emptyText}>No income recorded this month</Text>
          </View>
        ) : (
          incomeRecords.map((item) => {
            const sc = SOURCE_COLORS[item.source] || SOURCE_COLORS.Other;
            const icon = SOURCE_ICONS[item.source] || "money";
            return (
              <View key={item.id} style={s.incomeItem}>
                <View style={[s.incomeIcon, { backgroundColor: sc.bg }]}>
                  <FontAwesome name={icon as any} size={22} color={sc.fg} />
                </View>
                <View style={s.incomeDetails}>
                  <Text style={s.incomeTitle}>{item.description || item.source}</Text>
                  <Text style={s.incomeDate}>{fmtDate(item.created_at)}</Text>
                </View>
                <Text style={s.incomeAmount}>+{item.amount.toLocaleString()}</Text>
              </View>
            );
          })
        )}

        {/* Illustration */}
        <View style={s.illustration}>
          <View style={s.illustrationCircle}>
            <View style={s.figureBody} />
            <View style={s.figureHead} />
          </View>
          <Text style={s.illustrationText}>Precision in every Rwandan franc.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Income Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent
        onRequestClose={() => { setModalVisible(false); setFlwOptions(null); }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.overlay}>
          <Pressable style={s.backdrop} onPress={() => { setModalVisible(false); setFlwOptions(null); }} />
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.sheet}>
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>Add Income</Text>

              {/* Mode toggle */}
              <View style={s.modeToggle}>
                <Pressable style={[s.modeBtn, incomeMode === "manual" && s.modeBtnActive]} onPress={() => setIncomeMode("manual")}>
                  <Text style={[s.modeBtnText, incomeMode === "manual" && { color: PRIMARY }]}>Manual</Text>
                </Pressable>
                <Pressable style={[s.modeBtn, incomeMode === "flutterwave" && s.modeBtnActive]} onPress={() => setIncomeMode("flutterwave")}>
                  <Text style={[s.modeBtnText, incomeMode === "flutterwave" && { color: PRIMARY }]}>Flutterwave</Text>
                  <View style={s.flwDot} />
                </Pressable>
              </View>

              {/* Source chips */}
              <Text style={s.fieldLabel}>SOURCE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {INCOME_SOURCES.map((src) => (
                  <Pressable key={src} style={[s.chip, source === src && s.chipActive]} onPress={() => setSource(src)}>
                    <Text style={[s.chipText, source === src && { color: ON_PRIMARY }]}>{src}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Amount */}
              <View style={s.amountWrap}>
                <Text style={s.amountLabel}>AMOUNT ({currency})</Text>
                <TextInput
                  value={amount} onChangeText={setAmount}
                  placeholder="0" placeholderTextColor={OUTLINE_VARIANT}
                  keyboardType="decimal-pad"
                  style={s.amountInput}
                />
              </View>

              {/* Description */}
              <TextInput
                value={description} onChangeText={setDescription}
                placeholder="Description (Optional)"
                placeholderTextColor={OUTLINE}
                style={s.descInput}
              />

              {/* Action button */}
              {incomeMode === "manual" ? (
                <Pressable style={s.confirmBtn} onPress={handleManualIncome} disabled={submitting}>
                  {submitting ? <ActivityIndicator color={ON_PRIMARY} size="small" /> : <Text style={s.confirmBtnText}>Confirm Deposit</Text>}
                </Pressable>
              ) : flwOptions ? (
                <PayWithFlutterwave
                  onRedirect={async (data: FlwRedirectParams) => {
                    if (data.status === "successful" && data.transaction_id) {
                      setSubmitting(true);
                      try {
                        await apiClient.post("/payments/verify", {
                          transaction_id: data.transaction_id, tx_ref: data.tx_ref,
                          payment_type: "income", month, year, category: source,
                          description: description.trim() || undefined,
                        });
                        await loadIncome(); refreshTransactions();
                        notifyIncomeRecorded(formatCurrency(parseFloat(amount), currency), source);
                        setAmount(""); setDescription(""); setSource("Salary");
                        setFlwOptions(null); setModalVisible(false);
                      } catch (e: any) { Alert.alert("Error", e.message || "Failed"); }
                      finally { setSubmitting(false); }
                    } else { setFlwOptions(null); }
                  }}
                  options={flwOptions as FlwOptions}
                  customButton={(props) => { setTimeout(() => props.onPress(), 100); return null; }}
                />
              ) : (
                <Pressable style={s.confirmBtn} onPress={preparePayment} disabled={submitting}>
                  {submitting ? <ActivityIndicator color={ON_PRIMARY} size="small" /> : <Text style={s.confirmBtnText}>Generate Payment Link</Text>}
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, backgroundColor: SURFACE },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#228271", borderWidth: 2, borderColor: "#9af3de", justifyContent: "center", alignItems: "center" },
  avatarText: { fontWeight: "700", fontSize: 13, color: "#f4fffa" },
  appName: { fontSize: 28, fontWeight: "800", color: PRIMARY, letterSpacing: -0.5 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  balanceCard: { backgroundColor: NAVY, borderRadius: 24, padding: 24, marginBottom: 20, overflow: "hidden", position: "relative" },
  balanceBlob: { position: "absolute", right: -32, top: -32, width: 128, height: 128, borderRadius: 64, backgroundColor: "#228271", opacity: 0.2 },
  balanceCaption: { fontSize: 12, fontWeight: "800", letterSpacing: 2, color: "rgba(255,255,255,0.7)", marginBottom: 6 },
  balanceAmountRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 24 },
  balanceCurrency: { fontSize: 16, fontWeight: "600", color: "#7ed6c2" },
  balanceAmount: { fontSize: 36, fontWeight: "900", color: ON_PRIMARY, letterSpacing: -1 },
  balanceDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginBottom: 20 },
  balanceRow: { flexDirection: "row", justifyContent: "space-around" },
  balanceSubCaption: { fontSize: 12, fontWeight: "800", letterSpacing: 1, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  balanceSubVal: { fontSize: 18, fontWeight: "600", color: ON_PRIMARY },

  addBtn: { backgroundColor: PRIMARY, borderRadius: 12, height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 28, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  addBtnText: { fontSize: 18, fontWeight: "700", color: ON_PRIMARY },

  historyHeader: { marginBottom: 14 },
  historyTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  historyTitle: { fontSize: 20, fontWeight: "700", color: ON_SURFACE },
  monthBadge: { backgroundColor: SECONDARY_CONTAINER, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  monthBadgeText: { fontSize: 10, fontWeight: "800", color: ON_SECONDARY_CONTAINER, letterSpacing: 0.5 },

  incomeItem: { backgroundColor: SURFACE_CONTAINER_LOW, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: OUTLINE_VARIANT + "50" },
  incomeIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginRight: 14 },
  incomeDetails: { flex: 1 },
  incomeTitle: { fontSize: 17, fontWeight: "600", color: ON_SURFACE, marginBottom: 2 },
  incomeDate: { fontSize: 13, fontWeight: "600", color: OUTLINE },
  incomeAmount: { fontSize: 18, fontWeight: "700", color: SECONDARY },

  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, fontWeight: "600", color: ON_SURFACE_VARIANT, marginTop: 12 },

  illustration: { alignItems: "center", paddingVertical: 32, opacity: 0.4 },
  illustrationCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#E8FAF1", justifyContent: "flex-end", alignItems: "center", overflow: "hidden", marginBottom: 10 },
  figureBody: { width: 32, height: 40, backgroundColor: NAVY, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  figureHead: { position: "absolute", top: 14, width: 20, height: 20, borderRadius: 10, backgroundColor: NAVY },
  illustrationText: { fontSize: 13, fontWeight: "600", color: ON_SURFACE_VARIANT },

  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { backgroundColor: "rgba(255,255,255,0.95)", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingBottom: 48 },
  sheetHandle: { width: 48, height: 6, backgroundColor: OUTLINE_VARIANT + "60", borderRadius: 3, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 24, fontWeight: "700", color: ON_SURFACE, marginBottom: 20 },

  modeToggle: { backgroundColor: SURFACE_CONTAINER_HIGH, borderRadius: 12, padding: 4, flexDirection: "row", marginBottom: 20 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  modeBtnActive: { backgroundColor: ON_PRIMARY, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  modeBtnText: { fontSize: 16, fontWeight: "700", color: OUTLINE },
  flwDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SECONDARY },

  fieldLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1, color: OUTLINE, marginBottom: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: SURFACE_CONTAINER_HIGHEST, marginRight: 8 },
  chipActive: { backgroundColor: PRIMARY },
  chipText: { fontSize: 14, fontWeight: "600", color: ON_SURFACE_VARIANT },

  amountWrap: { borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: OUTLINE_VARIANT, padding: 14, marginBottom: 14, position: "relative" },
  amountLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, color: OUTLINE, marginBottom: 4 },
  amountInput: { fontSize: 28, fontWeight: "900", color: PRIMARY },
  descInput: { borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: OUTLINE_VARIANT, padding: 14, fontSize: 16, fontWeight: "600", color: ON_SURFACE, marginBottom: 20 },

  confirmBtn: { backgroundColor: SECONDARY, borderRadius: 12, height: 56, alignItems: "center", justifyContent: "center", shadowColor: SECONDARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  confirmBtnText: { fontSize: 18, fontWeight: "700", color: ON_PRIMARY },
});
