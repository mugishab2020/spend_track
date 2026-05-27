import FontAwesome from "@expo/vector-icons/FontAwesome";
import TopBar from "@/components/TopBar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
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
import { useTransactions } from "@/context/TransactionsContext";
import { apiClient } from "@/services/api";
import { buildFlwOptions, FlwRedirectParams } from "@/services/flutterwave.service";
import { notifyCategoryWarning, notifyIncomeRecorded } from "@/services/notifications.service";
import { formatCurrency } from "@/utils/money";
import { PayWithFlutterwave } from "flutterwave-react-native";
type FlwOptions = Parameters<typeof PayWithFlutterwave>[0]["options"];

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

const CAT_COLORS: Record<string, string> = {
  "Food & Dining": "#E02424", Transport: "#1C64F2", "Housing & Bills": ERROR,
  Health: "#2563EB", Shopping: "#16A34A", Entertainment: "#EA580C",
  Education: "#2563EB", "Personal Care": "#9333EA", Savings: "#D97706", Other: OUTLINE,
};
const CAT_BG: Record<string, string> = {
  "Food & Dining": "#FDE8E8", Transport: "#E1EFFE", "Housing & Bills": "#FDF2F2",
  Health: "#EBF5FF", Shopping: "#F0FDF4", Entertainment: "#FFF7ED",
  Education: "#EFF6FF", "Personal Care": "#FDF4FF", Savings: "#FEF3C7", Other: "#F1F5F9",
};

const INCOME_SOURCES = ["Salary", "Freelance", "Gift", "Investment", "Bonus", "Other"];

type TxType = "expense" | "income";
type PayMode = "manual" | "flutterwave";

export default function AddTransactionScreen() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const { refreshTransactions } = useTransactions();
  const currency = user?.currency || "RWF";

  const [txType, setTxType] = useState<TxType>("expense");
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [incomeSource, setIncomeSource] = useState("Salary");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [payMode, setPayMode] = useState<PayMode>("manual");
  const [submitting, setSubmitting] = useState(false);
  const [flwOptions, setFlwOptions] = useState<any>(null);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const reset = () => {
    setAmount(""); setDescription(""); setSelectedCat(null);
    setFlwOptions(null); setSubmitting(false);
  };

  const handleManual = async () => {
    const parsed = parseFloat(amount);
    if (!amount.trim() || isNaN(parsed) || parsed <= 0) {
      Alert.alert("Error", "Please enter a valid amount"); return;
    }
    if (txType === "expense" && !selectedCat) {
      Alert.alert("Error", "Please select a category"); return;
    }
    setSubmitting(true);
    try {
      if (txType === "expense") {
        await apiClient.post("/transactions", {
          amount: parsed, type: "expense",
          category_id: selectedCat.id, category: selectedCat.name,
          description: description.trim() || undefined,
          month, year, source: "manual", status: "completed",
        });
        // Budget warnings
        const spent = parsed; // simplified — full check happens on home screen
        const cap = selectedCat.cap_amount;
        if (cap && cap > 0) {
          const pct = (spent / cap) * 100;
          if (pct >= 100) notifyCategoryWarning(selectedCat.name, 100);
          else if (pct >= 80) notifyCategoryWarning(selectedCat.name, pct);
        }
      } else {
        await apiClient.post("/transactions", {
          amount: parsed, type: "income", category: incomeSource,
          description: description.trim() || undefined,
          month, year, source: "manual", status: "completed",
        });
        notifyIncomeRecorded(formatCurrency(parsed, currency), incomeSource);
      }
      await refreshTransactions();
      Alert.alert("✅ Recorded", `${txType === "expense" ? "Expense" : "Income"} of ${formatCurrency(parsed, currency)} recorded.`);
      reset();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to record transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const prepareFlw = () => {
    const parsed = parseFloat(amount);
    if (!amount.trim() || isNaN(parsed) || parsed <= 0) {
      Alert.alert("Error", "Please enter a valid amount first"); return;
    }
    if (txType === "expense" && !selectedCat) {
      Alert.alert("Error", "Please select a category first"); return;
    }
    setFlwOptions(buildFlwOptions({
      amount: parsed, currency,
      customerEmail: user?.email || "user@spendtrack.app",
      customerName: user?.full_name || "User",
      description: txType === "expense"
        ? `${selectedCat?.name}${description ? " — " + description : ""}`
        : `Income: ${incomeSource}${description ? " — " + description : ""}`,
      type: txType,
    }));
  };

  return (
    <SafeAreaView style={s.safe}>
      <TopBar title="Add Transaction" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            {/* Type toggle */}
            <View style={s.typeToggle}>
              <Pressable
                style={[s.typeBtn, txType === "expense" && s.typeBtnActiveExpense]}
                onPress={() => { setTxType("expense"); setSelectedCat(null); }}
              >
                <FontAwesome name="arrow-up" size={14} color={txType === "expense" ? ON_PRIMARY : ON_SURFACE_VARIANT} style={{ marginRight: 6 }} />
                <Text style={[s.typeBtnText, txType === "expense" && { color: ON_PRIMARY }]}>Expense</Text>
              </Pressable>
              <Pressable
                style={[s.typeBtn, txType === "income" && s.typeBtnActiveIncome]}
                onPress={() => { setTxType("income"); setSelectedCat(null); }}
              >
                <FontAwesome name="arrow-down" size={14} color={txType === "income" ? ON_PRIMARY : ON_SURFACE_VARIANT} style={{ marginRight: 6 }} />
                <Text style={[s.typeBtnText, txType === "income" && { color: ON_PRIMARY }]}>Income</Text>
              </Pressable>
            </View>

            {/* Category / Source */}
            {txType === "expense" ? (
              <>
                <Text style={s.sectionLabel}>SELECT CATEGORY</Text>
                <View style={s.catGrid}>
                  {categories.map((cat) => {
                    const active = selectedCat?.id === cat.id;
                    const color = CAT_COLORS[cat.name] || OUTLINE;
                    const bg = CAT_BG[cat.name] || "#F1F5F9";
                    return (
                      <Pressable
                        key={cat.id}
                        style={[s.catCard, active && { borderColor: color, borderWidth: 2 }]}
                        onPress={() => setSelectedCat(cat)}
                      >
                        <View style={[s.catIcon, { backgroundColor: bg }]}>
                          <FontAwesome name={(cat.icon || "tag") as any} size={20} color={color} />
                        </View>
                        <Text style={[s.catName, active && { color }]} numberOfLines={2}>{cat.name}</Text>
                        {active && <View style={[s.catCheck, { backgroundColor: color }]}><FontAwesome name="check" size={10} color="#fff" /></View>}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={s.sectionLabel}>INCOME SOURCE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {INCOME_SOURCES.map((src) => (
                    <Pressable
                      key={src}
                      style={[s.chip, incomeSource === src && s.chipActive]}
                      onPress={() => setIncomeSource(src)}
                    >
                      <Text style={[s.chipText, incomeSource === src && { color: ON_PRIMARY }]}>{src}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Amount */}
            <Text style={s.sectionLabel}>AMOUNT ({currency})</Text>
            <View style={s.amountWrap}>
              <Text style={s.amountCurrency}>{currency}</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={OUTLINE_VARIANT}
                keyboardType="decimal-pad"
                style={s.amountInput}
              />
            </View>

            {/* Description */}
            <Text style={s.sectionLabel}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Lunch at restaurant"
              placeholderTextColor={OUTLINE}
              style={s.descInput}
            />

            {/* Payment mode */}
            <Text style={s.sectionLabel}>PAYMENT METHOD</Text>
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

            {/* Submit */}
            {payMode === "manual" ? (
              <Pressable style={[s.submitBtn, { backgroundColor: txType === "expense" ? ERROR : SECONDARY }]} onPress={handleManual} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color={ON_PRIMARY} size="small" />
                  : <Text style={s.submitBtnText}>Record {txType === "expense" ? "Expense" : "Income"}</Text>
                }
              </Pressable>
            ) : flwOptions ? (
              <PayWithFlutterwave
                onRedirect={async (data: FlwRedirectParams) => {
                  if (data.status === "successful" && data.transaction_id) {
                    setSubmitting(true);
                    try {
                      await apiClient.post("/payments/verify", {
                        transaction_id: data.transaction_id,
                        tx_ref: data.tx_ref,
                        payment_type: txType,
                        category_id: txType === "expense" ? selectedCat?.id : undefined,
                        category: txType === "income" ? incomeSource : selectedCat?.name,
                        month, year,
                        description: description.trim() || undefined,
                      });
                      await refreshTransactions();
                      Alert.alert("✅ Payment recorded", `${formatCurrency(parseFloat(amount), currency)} ${txType} recorded via Flutterwave.`);
                      reset();
                    } catch (e: any) { Alert.alert("Error", e.message || "Failed"); }
                    finally { setSubmitting(false); }
                  } else { setFlwOptions(null); }
                }}
                options={flwOptions as FlwOptions}
                customButton={(props) => {
                  setTimeout(() => props.onPress(), 100);
                  return null;
                }}
              />
            ) : (
              <Pressable style={[s.submitBtn, { backgroundColor: PRIMARY }]} onPress={prepareFlw} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color={ON_PRIMARY} size="small" />
                  : <Text style={s.submitBtnText}>Pay via Flutterwave</Text>
                }
              </Pressable>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SURFACE },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "900", color: ON_SURFACE, marginBottom: 4 },
  subtitle: { fontSize: 14, fontWeight: "600", color: ON_SURFACE_VARIANT, marginBottom: 24 },

  typeToggle: { flexDirection: "row", backgroundColor: SURFACE_CONTAINER_HIGH, borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 },
  typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10 },
  typeBtnActiveExpense: { backgroundColor: ERROR },
  typeBtnActiveIncome: { backgroundColor: SECONDARY },
  typeBtnText: { fontSize: 15, fontWeight: "700", color: ON_SURFACE_VARIANT },

  sectionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, color: OUTLINE, marginBottom: 10 },

  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  catCard: {
    width: "30%", backgroundColor: SURFACE_LOWEST, borderRadius: 14,
    padding: 12, alignItems: "center", borderWidth: 1, borderColor: OUTLINE_VARIANT,
    position: "relative",
  },
  catIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  catName: { fontSize: 11, fontWeight: "700", color: ON_SURFACE, textAlign: "center" },
  catCheck: { position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" },

  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: SURFACE_CONTAINER_HIGH, marginRight: 8 },
  chipActive: { backgroundColor: PRIMARY },
  chipText: { fontSize: 14, fontWeight: "600", color: ON_SURFACE_VARIANT },

  amountWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: SURFACE_LOWEST, borderRadius: 14,
    borderWidth: 1, borderColor: OUTLINE_VARIANT,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20, gap: 8,
  },
  amountCurrency: { fontSize: 16, fontWeight: "700", color: OUTLINE },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "900", color: PRIMARY },

  descInput: {
    backgroundColor: SURFACE_LOWEST, borderRadius: 14,
    borderWidth: 1, borderColor: OUTLINE_VARIANT,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontWeight: "600", color: ON_SURFACE, marginBottom: 20,
  },

  modeToggle: { flexDirection: "row", backgroundColor: SURFACE_CONTAINER_HIGH, borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10 },
  modeBtnActive: { backgroundColor: SURFACE_LOWEST, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  modeBtnText: { fontSize: 14, fontWeight: "700", color: ON_SURFACE_VARIANT },

  submitBtn: { borderRadius: 14, height: 56, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  submitBtnText: { fontSize: 17, fontWeight: "700", color: ON_PRIMARY },
});
