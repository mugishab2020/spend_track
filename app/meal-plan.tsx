import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { apiClient } from "@/services/api";
import { formatCurrency } from "@/utils/money";

export default function MealPlanScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  useProtectedRoute();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const now = new Date();
    apiClient
      .get<any>(`/ai/meal-transport-plan?month=${now.getMonth() + 1}&year=${now.getFullYear()}&plan_type=meal`)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []));

  const meal = data?.meal_plan;
  const currency = data?.currency || user?.currency || "RWF";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <FontAwesome name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>🍽️ Meal Plan</Text>
          {data?.month && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{data.month}</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} size="large" />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {/* Budget summary */}
          <View style={[styles.banner, { backgroundColor: colors.primary }]}>
            <View style={styles.bannerStat}>
              <Text style={styles.bannerValue}>{formatCurrency(data?.food_budget ?? 0, currency)}</Text>
              <Text style={styles.bannerLabel}>Monthly Budget</Text>
            </View>
            <View style={styles.bannerDivider} />
            <View style={styles.bannerStat}>
              <Text style={styles.bannerValue}>{formatCurrency(data?.daily_food_allowance ?? 0, currency)}</Text>
              <Text style={styles.bannerLabel}>Daily Allowance</Text>
            </View>
            <View style={styles.bannerDivider} />
            <View style={styles.bannerStat}>
              <Text style={styles.bannerValue}>{formatCurrency(data?.food_remaining ?? 0, currency)}</Text>
              <Text style={styles.bannerLabel}>Remaining</Text>
            </View>
          </View>

          {/* AI personalised plan */}
          {meal?.ai_plan && (
            <View style={[styles.aiCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <View style={styles.aiHeader}>
                <FontAwesome name="star" size={14} color={colors.primary} />
                <Text style={[styles.aiTitle, { color: colors.primary }]}>AI Personalised Meal Plan</Text>
              </View>
              <Text style={[styles.aiBody, { color: colors.text }]}>{meal.ai_plan}</Text>
            </View>
          )}

          {/* Weekly plan */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>WEEKLY RWANDAN MEAL PLAN</Text>
          {meal?.static_plan?.map((day: any, i: number) => (
            <View key={i} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayName, { color: colors.primary }]}>{day.day}</Text>
                <Text style={[styles.dayCost, { color: colors.textSecondary }]}>
                  ~{formatCurrency(day.estimated_cost, currency)}
                </Text>
              </View>
              <MealRow icon="sun-o" label="Breakfast" meal={day.breakfast} colors={colors} />
              <MealRow icon="cutlery" label="Lunch" meal={day.lunch} colors={colors} />
              <MealRow icon="moon-o" label="Dinner" meal={day.dinner} colors={colors} />
            </View>
          ))}

          {/* Tips */}
          {meal?.tips?.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MONEY-SAVING TIPS</Text>
              {meal.tips.map((tip: string, i: number) => (
                <View key={i} style={[styles.tipRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

function MealRow({ icon, label, meal, colors }: any) {
  return (
    <View style={styles.mealRow}>
      <FontAwesome name={icon} size={12} color={colors.textSecondary} style={{ width: 16 }} />
      <Text style={[styles.mealLabel, { color: colors.textSecondary }]}>{label}:</Text>
      <Text style={[styles.mealText, { color: colors.text }]}>{meal}</Text>
    </View>
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

  aiCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 16 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  aiTitle: { fontSize: 13, fontWeight: "700" },
  aiBody: { fontSize: 13, lineHeight: 20 },

  dayCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  dayName: { fontSize: 15, fontWeight: "800" },
  dayCost: { fontSize: 12 },
  mealRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6, gap: 6 },
  mealLabel: { fontSize: 12, fontWeight: "600", width: 60 },
  mealText: { fontSize: 13, flex: 1, lineHeight: 18 },

  tipRow: { flexDirection: "row", alignItems: "flex-start", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  tipText: { fontSize: 13, flex: 1, lineHeight: 19 },
});
