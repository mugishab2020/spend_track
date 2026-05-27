import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { apiClient } from "@/services/api";
import { formatCurrency } from "@/utils/money";

type Tab = "insights" | "plan" | "optimize" | "lifestyle";

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: "insights",  icon: "lightbulb-o",      label: "Insights"  },
  { key: "plan",      icon: "calendar",          label: "Plan"      },
  { key: "optimize",  icon: "sliders",           label: "Optimize"  },
  { key: "lifestyle", icon: "heart",             label: "Lifestyle" },
];

export default function AIInsightsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  useProtectedRoute();

  const [activeTab, setActiveTab] = useState<Tab>("insights");
  const [loading, setLoading] = useState(true);
  const [monthLabel, setMonthLabel] = useState("");

  const [insights, setInsights]     = useState<any[]>([]);
  const [plan, setPlan]             = useState<any[]>([]);
  const [planMeta, setPlanMeta]     = useState<any>(null);
  const [optimize, setOptimize]     = useState<any>(null);
  const [lifestyle, setLifestyle]   = useState<any>(null);

  useFocusEffect(useCallback(() => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    setLoading(true);

    Promise.all([
      apiClient.get<any>(`/ai/insights?month=${m}&year=${y}`),
      apiClient.get<any>(`/ai/plan?month=${m}&year=${y}`),
      apiClient.get<any>(`/ai/optimize?month=${m}&year=${y}`),
      apiClient.get<any>(`/ai/lifestyle-plan?month=${m}&year=${y}`),
    ])
      .then(([ins, pln, opt, lif]) => {
        setInsights(ins.data?.insights ?? []);
        setMonthLabel(ins.data?.month ?? "");
        setPlan(pln.data?.plan ?? []);
        setPlanMeta(pln.data ?? null);
        setOptimize(opt.data ?? null);
        setLifestyle(lif.data ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []));

  // Group plan by section
  const planSections = plan.reduce<Record<string, any[]>>((acc, item) => {
    const k = item.section || "General";
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <FontAwesome name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>AI Financial Advisor</Text>
          {!!monthLabel && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{monthLabel}</Text>}
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabBar, { backgroundColor: colors.surface }]}
        style={{ marginHorizontal: 16, borderRadius: 12, marginBottom: 12, flexGrow: 0 }}
      >
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setActiveTab(t.key)}
            style={[styles.tab, activeTab === t.key && { backgroundColor: colors.primary, borderRadius: 10 }]}
          >
            <FontAwesome name={t.icon as any} size={12} color={activeTab === t.key ? "#fff" : colors.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === t.key ? "#fff" : colors.textSecondary }]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} size="large" />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

          {/* ── INSIGHTS ── */}
          {activeTab === "insights" && (
            insights.length > 0
              ? insights.map((item, i) => <InsightCard key={i} item={item} colors={colors} />)
              : <Empty colors={colors} msg="Add income and expenses to get AI-driven insights." />
          )}

          {/* ── PLAN ── */}
          {activeTab === "plan" && (
            <>
              {planMeta?.projected_income > 0 && (
                <Banner color={colors.primary}>
                  <BannerStat label="Projected Income" value={formatCurrency(planMeta.projected_income, user?.currency)} />
                  <BannerDivider />
                  <BannerStat label="Avg Savings Rate" value={`${planMeta.avg_savings_rate}%`} />
                </Banner>
              )}
              {Object.keys(planSections).length > 0
                ? Object.entries(planSections).map(([section, items]) => (
                    <View key={section}>
                      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{section.toUpperCase()}</Text>
                      {items.map((item, i) => <InsightCard key={i} item={item} colors={colors} />)}
                    </View>
                  ))
                : <Empty colors={colors} msg="Record at least one month of data to generate a spending plan." />
              }
            </>
          )}

          {/* ── OPTIMIZE ── */}
          {activeTab === "optimize" && (
            optimize
              ? <>
                  <Banner color="#0B1F3F">
                    <BannerStat label="Potential Monthly Saving" value={formatCurrency(optimize.summary.potential_monthly_saving, optimize.currency)} />
                    <BannerDivider />
                    <BannerStat label="Potential Annual Saving" value={formatCurrency(optimize.summary.potential_annual_saving, optimize.currency)} />
                  </Banner>

                  <View style={[styles.legend, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {[
                      { badge: "🔴", label: "Essential — protect",       sub: "Do not cut" },
                      { badge: "🟡", label: "Important — trim 20%",      sub: "Reduce carefully" },
                      { badge: "🟢", label: "Discretionary — cut 50%",   sub: "Biggest saving opportunity" },
                    ].map((l) => (
                      <View key={l.badge} style={styles.legendRow}>
                        <Text style={styles.legendBadge}>{l.badge}</Text>
                        <View>
                          <Text style={[styles.legendLabel, { color: colors.text }]}>{l.label}</Text>
                          <Text style={[styles.legendSub, { color: colors.textSecondary }]}>{l.sub}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {optimize.categories.map((cat: any, i: number) => (
                    <View key={i} style={[styles.optCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: cat.color }]}>
                      <View style={styles.optCardHeader}>
                        <View style={[styles.iconWrap, { backgroundColor: cat.color + "20" }]}>
                          <FontAwesome name={(cat.icon || "tag") as any} size={15} color={cat.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.optTitleRow}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>{cat.name}</Text>
                            <View style={[styles.badge, { backgroundColor: cat.color + "20" }]}>
                              <Text style={[styles.badgeText, { color: cat.color }]}>{cat.badge} {cat.necessity_label}</Text>
                            </View>
                          </View>
                          <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                            Avg: {formatCurrency(cat.avg_monthly_spend, optimize.currency)}/mo
                            {cat.income_share > 0 ? `  ·  ${cat.income_share}% of income` : ""}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.barBg, { backgroundColor: colors.surface }]}>
                        <View style={[styles.barFill, { width: `${cat.necessity_score}%`, backgroundColor: cat.color }]} />
                      </View>
                      <Text style={[styles.barLabel, { color: colors.textSecondary }]}>Necessity score: {cat.necessity_score}/100</Text>
                      <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{cat.advice}</Text>
                      {cat.potential_saving > 0 && (
                        <View style={styles.chip}>
                          <FontAwesome name="leaf" size={11} color="#10B981" style={{ marginRight: 4 }} />
                          <Text style={styles.chipText}>Save up to {formatCurrency(cat.potential_saving, optimize.currency)}/month</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </>
              : <Empty colors={colors} msg="No category data yet. Add expenses to get optimization advice." />
          )}

          {/* ── LIFESTYLE ── */}
          {activeTab === "lifestyle" && (
            lifestyle
              ? <>
                  <Banner color="#10B981">
                    <BannerStat label="Monthly Income"  value={formatCurrency(lifestyle.income, lifestyle.currency)} />
                    <BannerDivider />
                    <BannerStat label="Saving Goal"     value={formatCurrency(lifestyle.saving_goal, lifestyle.currency)} />
                    <BannerDivider />
                    <BannerStat label="Spendable"       value={formatCurrency(lifestyle.spendable, lifestyle.currency)} />
                  </Banner>

                  {!!lifestyle.ai_tips && (
                    <View style={[styles.aiTipsCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                      <View style={styles.aiTipsHeader}>
                        <FontAwesome name="star" size={14} color={colors.primary} />
                        <Text style={[styles.aiTipsTitle, { color: colors.primary }]}>AI Personalised Tips</Text>
                      </View>
                      <Text style={[styles.cardBody, { color: colors.text }]}>{lifestyle.ai_tips}</Text>
                    </View>
                  )}

                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>YOUR MONTHLY LIFESTYLE BUDGET</Text>

                  {lifestyle.tiers.map((tier: any, i: number) => {
                    const isOver = tier.status?.includes("over");
                    const usedPct = tier.budget > 0 ? Math.min((tier.actual / tier.budget) * 100, 100) : 0;
                    const isFoodTier = tier.category.toLowerCase().includes("food");
                    const isTransportTier = tier.category.toLowerCase().includes("transport");
                    const isNavigable = isFoodTier || isTransportTier;

                    return (
                      <Pressable
                        key={i}
                        onPress={() => {
                          if (isFoodTier) router.push("/meal-plan");
                          else if (isTransportTier) router.push("/transport-plan");
                        }}
                        style={({ pressed }) => [
                          styles.tierCard,
                          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed && isNavigable ? 0.75 : 1 },
                        ]}
                      >
                        <View style={styles.tierHeader}>
                          <Text style={[styles.tierName, { color: colors.text }]}>{tier.category}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={[styles.tierBudget, { color: colors.primary }]}>
                              {formatCurrency(tier.budget, lifestyle.currency)}/mo
                            </Text>
                            {isNavigable && (
                              <FontAwesome name="chevron-right" size={12} color={colors.textSecondary} />
                            )}
                          </View>
                        </View>
                        {tier.actual > 0 && (
                          <>
                            <View style={[styles.barBg, { backgroundColor: colors.surface }]}>
                              <View style={[styles.barFill, { width: `${usedPct}%`, backgroundColor: isOver ? "#EF4444" : "#10B981" }]} />
                            </View>
                            <Text style={[styles.barLabel, { color: isOver ? "#EF4444" : colors.textSecondary }]}>{tier.status}</Text>
                          </>
                        )}
                        <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{tier.tip}</Text>
                        {isNavigable && (
                          <View style={[styles.dailyChip, { backgroundColor: colors.primary + "15" }]}>
                            <FontAwesome name={isFoodTier ? "cutlery" : "bus"} size={11} color={colors.primary} style={{ marginRight: 4 }} />
                            <Text style={[styles.dailyChipText, { color: colors.primary }]}>
                              Tap to see {isFoodTier ? "meal plan" : "transport plan"} →
                            </Text>
                          </View>
                        )}
                        <View style={[styles.dailyChip, { backgroundColor: colors.primary + "15", marginTop: 4 }]}>
                          <FontAwesome name="clock-o" size={11} color={colors.primary} style={{ marginRight: 4 }} />
                          <Text style={[styles.dailyChipText, { color: colors.primary }]}>
                            Daily allowance: {formatCurrency(tier.budget / 30, lifestyle.currency)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </>
              : <Empty colors={colors} msg="Add income to generate your lifestyle plan." />
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function InsightCard({ item, colors }: { item: any; colors: any }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: item.color }]}>
      <View style={[styles.iconWrap, { backgroundColor: item.color + "20" }]}>
        <FontAwesome name={item.icon as any} size={16} color={item.color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{item.body}</Text>
      </View>
    </View>
  );
}

function Banner({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <View style={[styles.banner, { backgroundColor: color }]}>
      {children}
    </View>
  );
}

function BannerStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.bannerStat}>
      <Text style={styles.bannerValue}>{value}</Text>
      <Text style={styles.bannerLabel}>{label}</Text>
    </View>
  );
}

function BannerDivider() {
  return <View style={styles.bannerDivider} />;
}

function Empty({ colors, msg }: { colors: any; msg: string }) {
  return (
    <View style={styles.empty}>
      <FontAwesome name="lightbulb-o" size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{msg}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },

  tabBar: { flexDirection: "row", padding: 4, gap: 4, borderRadius: 12 },
  tab: { flexDirection: "row", alignItems: "center", paddingVertical: 9, paddingHorizontal: 12, gap: 5 },
  tabText: { fontSize: 12, fontWeight: "700" },

  list: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, marginTop: 4 },

  // Insight / plan card
  card: { flexDirection: "row", borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 10, gap: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  cardBody: { fontSize: 13, lineHeight: 19 },
  cardMeta: { fontSize: 12 },

  // Banner
  banner: { borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  bannerStat: { alignItems: "center" },
  bannerValue: { fontSize: 16, fontWeight: "900", color: "#fff", marginBottom: 3 },
  bannerLabel: { fontSize: 10, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  bannerDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },

  // Optimize
  legend: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 10 },
  legendBadge: { fontSize: 18 },
  legendLabel: { fontSize: 13, fontWeight: "700" },
  legendSub: { fontSize: 11 },
  optCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 10 },
  optCardHeader: { flexDirection: "row", gap: 10, marginBottom: 10 },
  optTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  barBg: { height: 6, borderRadius: 3, marginBottom: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  barLabel: { fontSize: 11, marginBottom: 6 },
  chip: { flexDirection: "row", alignItems: "center", backgroundColor: "#10B98120", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8, alignSelf: "flex-start" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#10B981" },

  // Lifestyle
  aiTipsCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 14 },
  aiTipsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  aiTipsTitle: { fontSize: 13, fontWeight: "700" },
  tierCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  tierHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  tierName: { fontSize: 15, fontWeight: "700" },
  tierBudget: { fontSize: 15, fontWeight: "800" },
  dailyChip: { flexDirection: "row", alignItems: "center", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8, alignSelf: "flex-start" },
  dailyChipText: { fontSize: 12, fontWeight: "700" },

  // Empty
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, textAlign: "center", marginTop: 16, lineHeight: 22 },
});
