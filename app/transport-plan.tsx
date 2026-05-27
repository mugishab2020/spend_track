import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { apiClient } from "@/services/api";
import { formatCurrency } from "@/utils/money";

export default function TransportPlanScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  useProtectedRoute();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const now = new Date();
    apiClient
      .get<any>(`/ai/meal-transport-plan?month=${now.getMonth() + 1}&year=${now.getFullYear()}&plan_type=transport`)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []));

  const tp = data?.transport_plan;
  const currency = data?.currency || user?.currency || "RWF";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <FontAwesome name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>🚌 Transport Plan</Text>
          {data?.month && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{data.month}</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} size="large" />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {/* Budget banner */}
          <View style={[styles.banner, { backgroundColor: "#3B82F6" }]}>
            <View style={styles.bannerStat}>
              <Text style={styles.bannerValue}>{formatCurrency(data?.transport_budget ?? 0, currency)}</Text>
              <Text style={styles.bannerLabel}>Monthly Budget</Text>
            </View>
            <View style={styles.bannerDivider} />
            <View style={styles.bannerStat}>
              <Text style={styles.bannerValue}>{formatCurrency(data?.daily_transport_allowance ?? 0, currency)}</Text>
              <Text style={styles.bannerLabel}>Daily Allowance</Text>
            </View>
            <View style={styles.bannerDivider} />
            <View style={styles.bannerStat}>
              <Text style={styles.bannerValue}>{formatCurrency(data?.transport_remaining ?? 0, currency)}</Text>
              <Text style={styles.bannerLabel}>Remaining</Text>
            </View>
          </View>

          {/* Strategy */}
          {tp?.strategy && (
            <View style={[styles.strategyCard, { backgroundColor: colors.card, borderColor: "#3B82F6" }]}>
              <Text style={[styles.strategyTitle, { color: "#3B82F6" }]}>Recommended Strategy</Text>
              <Text style={[styles.strategyBody, { color: colors.text }]}>{tp.strategy}</Text>
              {tp.recommended_modes?.length > 0 && (
                <View style={styles.modesRow}>
                  {tp.recommended_modes.map((m: string, i: number) => (
                    <View key={i} style={[styles.modeChip, { backgroundColor: "#3B82F620" }]}>
                      <Text style={[styles.modeChipText, { color: "#3B82F6" }]}>{m}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* AI advice */}
          {tp?.ai_advice && (
            <View style={[styles.aiCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <View style={styles.aiHeader}>
                <FontAwesome name="star" size={14} color={colors.primary} />
                <Text style={[styles.aiTitle, { color: colors.primary }]}>AI Personalised Advice</Text>
              </View>
              <Text style={[styles.aiBody, { color: colors.text }]}>{tp.ai_advice}</Text>
            </View>
          )}

          {/* Transport options */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>KIGALI TRANSPORT OPTIONS</Text>
          {tp?.options?.map((opt: any, i: number) => (
            <View key={i} style={[styles.optCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.optMode, { color: colors.text }]}>{opt.mode}</Text>
              <Text style={[styles.optDesc, { color: colors.textSecondary }]}>{opt.description}</Text>
              <View style={styles.optMeta}>
                <View style={[styles.costChip, { backgroundColor: "#10B98120" }]}>
                  <Text style={styles.costChipText}>
                    ~{formatCurrency(opt.avg_daily_cost_rwf, "RWF")}/day
                  </Text>
                </View>
                <Text style={[styles.optBestFor, { color: colors.textSecondary }]}>Best for: {opt.best_for}</Text>
              </View>
              <View style={[styles.tipRow, { backgroundColor: colors.surface }]}>
                <FontAwesome name="lightbulb-o" size={12} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={[styles.tipText, { color: colors.text }]}>{opt.tip}</Text>
              </View>
            </View>
          ))}

          {/* Tips */}
          {tp?.tips?.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MONEY-SAVING TIPS</Text>
              {tp.tips.map((tip: string, i: number) => (
                <View key={i} style={[styles.generalTip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <FontAwesome name="lightbulb-o" size={14} color="#F59E0B" style={{ marginRight: 10, marginTop: 2 }} />
                  <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, marginTop: 4 },

  banner: { borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  bannerStat: { alignItems: "center" },
  bannerValue: { fontSize: 15, fontWeight: "900", color: "#fff", marginBottom: 3 },
  bannerLabel: { fontSize: 10, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  bannerDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },

  strategyCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 14 },
  strategyTitle: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  strategyBody: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  modesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modeChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  modeChipText: { fontSize: 12, fontWeight: "600" },

  aiCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 14 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  aiTitle: { fontSize: 13, fontWeight: "700" },
  aiBody: { fontSize: 13, lineHeight: 20 },

  optCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  optMode: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  optDesc: { fontSize: 13, marginBottom: 10 },
  optMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  costChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  costChipText: { fontSize: 12, fontWeight: "700", color: "#10B981" },
  optBestFor: { fontSize: 12, flex: 1 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", borderRadius: 8, padding: 8 },
  tipText: { fontSize: 12, flex: 1, lineHeight: 18 },

  generalTip: { flexDirection: "row", alignItems: "flex-start", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
});
