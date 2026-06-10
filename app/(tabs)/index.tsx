import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/context/CategoriesContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useTheme } from "@/context/ThemeContext";
import { useTransactions } from "@/context/TransactionsContext";
import { useSavingTargets } from "@/context/SavingTargetsContext";
import { apiClient } from "@/services/api";
import { buildFlwOptions, FlwRedirectParams } from "@/services/flutterwave.service";
import { notifyCategoryWarning, notifyAiPlanApplied } from "@/services/notifications.service";
import { formatCurrency } from "@/utils/money";
import { mapLegacyIcon } from "@/utils/icons";
import { SkeletonInsightCard, SkeletonPlanCard } from "@/components/SkeletonLoader";
import { PayWithFlutterwave } from "flutterwave-react-native";

type FlwOptions = Parameters<typeof PayWithFlutterwave>[0]["options"];

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { transactions, totals, addTransaction, refreshTransactions } = useTransactions();
  const { categories, updateCategory } = useCategories();
  const { savingTargets } = useSavingTargets();
  const { unreadCount } = useNotifications();
  const currency = user?.currency || "RWF";

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState<Record<string, number>>({});
  const [topInsight, setTopInsight] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [aiPlanLoading, setAiPlanLoading] = useState(true);
  const [aiPlanError, setAiPlanError] = useState<string | null>(null);
  const [editingPlans, setEditingPlans] = useState<Record<string, string>>({});
  const [applyingPlan, setApplyingPlan] = useState(false);
  const [walletBalance, setWalletBalance] = useState({ income: 0, expenses: 0, balance: 0 });

  // Simple cache with 5-minute expiry for AI responses
  const aiCacheRef = useRef<{ 
    insights?: { data: any[], timestamp: number },
    plan?: { data: any, timestamp: number }
  }>({});
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useFocusEffect(useCallback(() => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    const currentTime = Date.now();
    
    // Fetch wallet balance (all-time totals)
    apiClient.get<any>("/wallet/balance")
      .then((res) => setWalletBalance(res.data))
      .catch((error) => console.error("Failed to load wallet balance:", error));
    
    // Fetch monthly income for chart
    Promise.all(Array.from({ length: 6 }, async (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      try {
        const res = await apiClient.get<any>(`/transactions?type=income&month=${d.getMonth() + 1}&year=${d.getFullYear()}&limit=500`);
        return [key, (res.data?.items ?? []).reduce((s: number, r: any) => s + r.amount, 0)] as [string, number];
      } catch { return [key, 0] as [string, number]; }
    })).then((entries) => setMonthlyIncome(Object.fromEntries(entries)));
    
    // Fetch AI insights (with caching)
    const cachedInsights = aiCacheRef.current.insights;
    if (cachedInsights && (currentTime - cachedInsights.timestamp) < CACHE_DURATION) {
      // Use cached data
      setAiInsights(cachedInsights.data);
      setTopInsight(cachedInsights.data[0] ?? null);
      setAiLoading(false);
    } else {
      // Fetch fresh data
      setAiLoading(true);
      setAiError(null);
      apiClient.get<any>(`/ai/insights?month=${m}&year=${y}`)
        .then((res) => {
          const insights = res.data?.insights ?? [];
          setAiInsights(insights);
          setTopInsight(insights?.[0] ?? null);
          // Cache the result
          aiCacheRef.current.insights = { data: insights, timestamp: currentTime };
        })
        .catch((error) => {
          console.error("AI insights load failed", error);
          setAiInsights([]);
          setTopInsight(null);
          setAiError("Could not load AI analysis right now.");
        })
        .finally(() => setAiLoading(false));
    }
    
    // Fetch AI spending plan (with caching)
    const cachedPlan = aiCacheRef.current.plan;
    if (cachedPlan && (currentTime - cachedPlan.timestamp) < CACHE_DURATION) {
      // Use cached data
      setAiPlan(cachedPlan.data);
      setAiPlanLoading(false);
    } else {
      // Fetch fresh data
      setAiPlanLoading(true);
      setAiPlanError(null);
      apiClient.get<any>(`/ai/plan?month=${m}&year=${y}`)
        .then((res) => {
          setAiPlan(res.data);
          // Cache the result
          aiCacheRef.current.plan = { data: res.data, timestamp: currentTime };
        })
        .catch((error) => {
          console.error("AI plan load failed", error);
          setAiPlan(null);
          setAiPlanError("Could not load AI spending plan right now.");
        })
        .finally(() => setAiPlanLoading(false));
    }
  }, []));

  const applyAiPlan = async () => {
    if (!aiPlan?.plan) return;
    console.log("🤖 Applying AI Plan...");
    setApplyingPlan(true);
    try {
      const categoryItems = aiPlan.plan.filter((item: any) => item.section === "Category Plan");
      console.log(`Found ${categoryItems.length} category items to update`);
      
      for (const item of categoryItems) {
        const catName = item.title.split(":")[0].trim();
        const suggestedAmount = item.amount !== undefined
          ? parseFloat(item.amount)
          : parseFloat(item.title.match(/([0-9]+(?:\.[0-9]+)?)/)?.[1] ?? "0");
        
        // Try finding by ID first, then by name
        let cat = categories.find(c => c.id === item.category_id);
        if (!cat) {
          cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        }

        if (cat && suggestedAmount > 0) {
          console.log(`✅ Updating category: ${cat.name} (${cat.id}) -> ${suggestedAmount}`);
          await updateCategory(cat.id, { cap_amount: suggestedAmount });
        } else {
          console.warn(`⚠️ Could not find category for: ${catName} (ID: ${item.category_id})`);
        }
      }
      notifyAiPlanApplied();
      Alert.alert("Success", "All category budgets have been updated based on AI recommendations.");
    } catch (error) {
      console.error("❌ Failed to apply AI plan", error);
      Alert.alert("Error", "Failed to update some category budgets.");
    } finally {
      setApplyingPlan(false);
    }
  };

  const goal = savingTargets[0];
  const goalPct = goal?.targetAmount && totals.balance > 0
    ? Math.min((totals.balance / goal.targetAmount) * 100, 100) : 0;

  const categoryData = useMemo(() => {
    const spending: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense")
      .forEach((t) => { spending[t.category] = (spending[t.category] || 0) + t.amount; });
    return categories.map((cat) => {
      const spent = spending[cat.id] || 0;
      const budget = cat.cap_amount && cat.cap_amount > 0 ? cat.cap_amount : 500;
      return { 
        id: cat.id, 
        name: cat.name, 
        spent, 
        budget, 
        pct: budget > 0 ? (spent / budget) * 100 : 0, 
        icon: cat.icon, 
        color: colors.primary 
      };
    }).filter((c) => c.spent > 0).sort((a, b) => b.pct - a.pct).slice(0, 5);
  }, [categories, transactions, colors]);

  const fallbackInsights = useMemo(() => {
    const tips: any[] = [];
    if (walletBalance.expenses > walletBalance.income) {
      tips.push({
        title: "Spend less than you earn",
        body: `Your expenses are currently ${formatCurrency(walletBalance.expenses - walletBalance.income, currency)} above income. Review discretionary categories and reduce non-essential spending.`,
        icon: "alert-circle-outline",
        color: "#DC2626",
      });
    }
    if (goal) {
      tips.push({
        title: "Savings goal progress",
        body: `You have reached ${goalPct.toFixed(0)}% of your savings target. Keep your current balance on track by limiting large expenses this month.`,
        icon: "target",
        color: colors.primary,
      });
    }
    if (categoryData.length > 0) {
      const overSpending = categoryData.find((cat) => cat.pct >= 80);
      if (overSpending) {
        tips.push({
          title: `Watch ${overSpending.name}`,
          body: `Your spending in ${overSpending.name} is ${overSpending.pct.toFixed(0)}% of its budget. Consider trimming this category before the month ends.`,
          icon: "cash-remove",
          color: "#F59E0B",
        });
      }
    }
    if (tips.length === 0) {
      tips.push({
        title: "AI insights are ready",
        body: "Add a few transactions and revisit the dashboard for personalised AI guidance on your spending habits.",
        icon: "lightbulb-on-outline",
        color: colors.primary,
      });
    }
    return tips.slice(0, 2);
  }, [walletBalance, goal, goalPct, categoryData, currency, colors.primary]);

  const displayedInsights = aiLoading ? [] : (aiInsights.length > 0 ? aiInsights : fallbackInsights);

  const { labels, incomeData, expenseData } = useMemo(() => {
    const now = new Date();
    const labels: string[] = [], incomeData: number[] = [], expenseData: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      labels.push(d.toLocaleDateString("en-US", { month: "short" }));
      incomeData.push(monthlyIncome[key] ?? 0);
      expenseData.push(transactions.filter((t) => {
        const td = new Date(t.date);
        return `${td.getFullYear()}-${td.getMonth()}` === key && t.type === "expense";
      }).reduce((s, t) => s + t.amount, 0));
    }
    return { labels, incomeData, expenseData };
  }, [transactions, monthlyIncome]);

  const hasChartData = incomeData.some((v) => v > 0) || expenseData.some((v) => v > 0);
  const screenW = Dimensions.get("window").width - 40;

  const openExpenseModal = (cat: any) => {
    setSelectedCat(cat); setAmount(""); setDescription(""); setModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ backgroundColor: colors.card }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>ST</Text>
            </View>
            <Text style={[styles.brandName, { color: colors.primary }]}>SpendTrack</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="search" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push("/notifications")}
            >
              <MaterialIcons name="notifications-none" size={24} color={colors.primary} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.avatarContainer, { backgroundColor: colors.primaryLight }]}
              onPress={() => router.push("/profile")}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(user?.full_name || "ED").slice(0, 2).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Balance Card Section */}
        <View style={[styles.balanceSection, { backgroundColor: colors.primary }]}>
          <View style={[styles.balanceBlob, styles.blob1]} />
          <View style={[styles.balanceBlob, styles.blob2]} />
          
          <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
          <Text style={styles.balanceAmount}>{currency} {walletBalance.balance.toLocaleString()}</Text>
          
          <View style={styles.balanceGrid}>
            <View style={styles.balanceItem}>
              <View style={styles.balanceIconWrapper}>
                <MaterialIcons name="arrow-upward" size={16} color="#FFF" />
              </View>
              <View>
                <Text style={styles.balanceSubLabel}>INCOME</Text>
                <Text style={styles.balanceSubValue}>{currency} {walletBalance.income.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.balanceItem}>
              <View style={styles.balanceIconWrapper}>
                <MaterialIcons name="arrow-downward" size={16} color="#FFF" />
              </View>
              <View>
                <Text style={styles.balanceSubLabel}>EXPENSES</Text>
                <Text style={styles.balanceSubValue}>{currency} {walletBalance.expenses.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Section (Rounded Overlap) */}
        <View style={[styles.mainContent, { backgroundColor: colors.background }]}>
          
          <View style={[styles.aiSection, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.aiSectionHeader}>
              <View style={[styles.insightIcon, { backgroundColor: colors.primary }]}> 
                <MaterialCommunityIcons name="robot-happy-outline" size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiSectionTitle, { color: colors.text }]}>Live AI analysis</Text>
                <Text style={[styles.aiSectionSubtitle, { color: colors.textSecondary }]}>Realtime spending tips and suggestions based on your latest data.</Text>
              </View>
            </View>
            {aiLoading ? (
              <>
                <SkeletonInsightCard colors={colors} />
                <SkeletonInsightCard colors={colors} />
              </>
            ) : (
              displayedInsights.map((item, idx) => (
                <View key={idx} style={[styles.aiTipCard, { backgroundColor: colors.card, borderColor: item.color || colors.primary }]}> 
                  <View style={[styles.tipIcon, { backgroundColor: (item.color || colors.primary) + "22" }]}> 
                    <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color || colors.primary} />
                  </View>
                  <View style={styles.aiTipContent}>
                    <Text style={[styles.aiTipTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.aiTipBody, { color: colors.textSecondary }]}>{item.body}</Text>
                  </View>
                </View>
              ))
            )}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable 
                style={[styles.aiChatButton, { backgroundColor: colors.primary, flex: 1 }]} 
                onPress={() => router.push("/ai-chat")}
              > 
                <MaterialCommunityIcons name="chat-processing" size={18} color="#FFF" />
                <Text style={styles.aiChatButtonText}>Ask AI</Text>
              </Pressable>
              <Pressable 
                style={[styles.aiChatButton, { backgroundColor: "#8B5CF6", flex: 1 }]} 
                onPress={async () => {
                  const { triggerAICategorization } = await import("@/utils/aiCategorization");
                  triggerAICategorization(() => refreshTransactions());
                }}
              > 
                <MaterialCommunityIcons name="tag-multiple" size={18} color="#FFF" />
                <Text style={styles.aiChatButtonText}>Auto-Categorize</Text>
              </Pressable>
            </View>
          </View>

          {/* AI Spending Plan Section */}
          <View style={[styles.aiSection, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.aiSectionHeader}>
              <View style={[styles.insightIcon, { backgroundColor: colors.primary }]}> 
                <MaterialCommunityIcons name="clipboard-list-outline" size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiSectionTitle, { color: colors.text }]}>AI Spending Plan</Text>
                <Text style={[styles.aiSectionSubtitle, { color: colors.textSecondary }]}>AI-powered allocations with adjustable category budgets.</Text>
              </View>
            </View>
            {aiPlanLoading ? (
              <>
                <SkeletonPlanCard colors={colors} />
                <SkeletonPlanCard colors={colors} />
                <SkeletonPlanCard colors={colors} />
              </>
            ) : aiPlan?.plan ? (
              <>
                {aiPlan.ai_plan_summary ? (
                  <View style={[styles.aiTipCard, { backgroundColor: colors.card, borderColor: colors.primary }]}> 
                    <View style={[styles.tipIcon, { backgroundColor: colors.primary + "22" }]}> 
                      <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.aiTipContent}>
                      <Text style={[styles.aiTipTitle, { color: colors.text }]}>AI summary</Text>
                      <Text style={[styles.aiTipBody, { color: colors.textSecondary }]}>{aiPlan.ai_plan_summary}</Text>
                    </View>
                  </View>
                ) : null}
                {aiPlan.plan.filter((item: any) => item.section === "Category Plan").map((item: any, idx: number) => {
                const catName = item.title.split(":")[0];
                const suggestedAmount = item.amount !== undefined
                  ? String(item.amount)
                  : (item.title.match(/([0-9]+(?:\.[0-9]+)?)/)?.[1] ?? "0");
                const isEditing = editingPlans[catName] !== undefined;
                const currentAmount = editingPlans[catName] || suggestedAmount;
                return (
                  <View key={idx} style={[styles.aiTipCard, { backgroundColor: colors.card, borderColor: item.color || colors.primary }]}> 
                    <View style={[styles.tipIcon, { backgroundColor: (item.color || colors.primary) + "22" }]}> 
                      <MaterialCommunityIcons name={mapLegacyIcon(item.icon) as any} size={18} color={item.color || colors.primary} />
                    </View>
                    <View style={styles.aiTipContent}>
                      <Text style={[styles.aiTipTitle, { color: colors.text }]}>{catName}</Text>
                      <Text style={[styles.aiTipBody, { color: colors.textSecondary }]}>{item.body}</Text>
                      <View style={styles.planAmountRow}>
                        <Text style={[styles.planAmountLabel, { color: colors.textSecondary }]}>Budget: </Text>
                        {isEditing ? (
                          <TextInput
                            style={[styles.planAmountInput, { color: colors.text, borderColor: colors.border }]}
                            value={currentAmount}
                            onChangeText={(text) => setEditingPlans({ ...editingPlans, [catName]: text })}
                            keyboardType="numeric"
                            placeholder="Amount"
                          />
                        ) : (
                          <Text style={[styles.planAmountValue, { color: colors.primary }]}>{currency} {currentAmount}</Text>
                        )}
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => {
                            if (isEditing) {
                              // Save the amount to category cap_amount
                              const cat = categories.find(c => c.name === catName);
                              if (cat) {
                                const newAmount = parseFloat(currentAmount) || 0;
                                updateCategory(cat.id, { cap_amount: newAmount })
                                  .then(() => {
                                    Alert.alert("Budget Updated", `Set ${catName} budget to ${currency} ${newAmount}`);
                                  })
                                  .catch((error) => {
                                    console.error("Failed to update category", error);
                                    Alert.alert("Error", "Failed to update budget");
                                  });
                              }
                              setEditingPlans({ ...editingPlans, [catName]: undefined });
                            } else {
                              setEditingPlans({ ...editingPlans, [catName]: suggestedAmount });
                            }
                          }}
                        >
                          <MaterialIcons name={isEditing ? "check" : "edit"} size={16} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  );
                })}
                {aiPlan?.plan && (
                  <TouchableOpacity 
                    style={[styles.aiChatButton, { backgroundColor: colors.primary, marginTop: 16 }]} 
                    onPress={applyAiPlan}
                    disabled={applyingPlan}
                  > 
                    {applyingPlan ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check-all" size={18} color="#FFF" />
                        <Text style={styles.aiChatButtonText}>Apply Suggested Budgets</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.aiLoading}>
                <Text style={[styles.aiLoadingText, { color: colors.textSecondary }]}>No AI plan available yet. Add more transactions to get personalized recommendations.</Text>
              </View>
            )}
          </View>

          {/* Saving Goal Card */}
          {goal && (
            <TouchableOpacity 
              style={[styles.goalCard, { backgroundColor: colors.card }]} 
              onPress={() => router.push("/(tabs)/targets")}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Monthly Savings</Text>
                <Text style={[styles.goalPct, { color: colors.primary }]}>{goalPct.toFixed(0)}%</Text>
              </View>
              <View style={[styles.progressBackground, { backgroundColor: colors.borderLight }]}>
                <View style={[styles.progressFill, { width: `${goalPct}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Goal: <Text style={{ color: colors.primary }}>{formatCurrency(goal.targetAmount ?? 0, currency)}</Text>
              </Text>
            </TouchableOpacity>
          )}

          {/* Top Spending Categories */}
          {categoryData.length > 0 && (
            <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Spending</Text>
              {categoryData.map((cat) => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={styles.catRow} 
                  onPress={() => cat.name.toLowerCase() === "savings" ? router.push("/(tabs)/targets") : openExpenseModal(cat)}
                >
                  <View style={styles.catHeader}>
                    <View style={styles.catLabel}>
                      <MaterialCommunityIcons name={mapLegacyIcon(cat.icon || "tag-outline") as any} size={18} color={cat.color} />
                      <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                    </View>
                    <Text style={[styles.catValue, { color: cat.pct >= 100 ? colors.error : colors.textSecondary }]}>
                      {cat.pct.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={[styles.miniBarBackground, { backgroundColor: colors.borderLight }]}>
                    <View 
                      style={[
                        styles.miniBarFill, 
                        { 
                          width: `${Math.min(cat.pct, 100)}%`, 
                          backgroundColor: cat.pct >= 100 ? colors.error : cat.color 
                        }
                      ]} 
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Chart Section */}
          <View style={[styles.sectionCard, { backgroundColor: "#FFF" }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cash Flow</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Expenses</Text>
              </View>
            </View>
            {hasChartData ? (
              <LineChart
                data={{ 
                  labels, 
                  datasets: [
                    { data: incomeData, color: () => colors.primary, strokeWidth: 3 }, 
                    { data: expenseData, color: () => colors.warning, strokeWidth: 3 }
                  ] 
                }}
                width={screenW} 
                height={180}
                withDots={false}
                withInnerLines={false}
                withOuterLines={false}
                withHorizontalLabels={false}
                chartConfig={{ 
                  backgroundColor: "transparent", 
                  backgroundGradientFrom: "#fff", 
                  backgroundGradientTo: "#fff", 
                  decimalPlaces: 0, 
                  color: () => colors.border, 
                  labelColor: () => colors.textSecondary,
                }}
                bezier 
                style={styles.chart}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Text style={[styles.emptyChartText, { color: colors.textTertiary }]}>
                  Add transactions to see your flow
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
        onPress={() => router.push("/ai-chat")}
      >
        <MaterialCommunityIcons name="robot" size={22} color="#FFF" />
        <Text style={styles.fabLabel}>AI Chat</Text>
      </TouchableOpacity>

      {/* Expense Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={[styles.bottomSheet, { backgroundColor: colors.background }]}>
                <View style={styles.sheetHeader}>
                  <View style={[styles.sheetIconWrapper, { backgroundColor: (selectedCat?.color || colors.primary) + "15" }]}>
                    <MaterialCommunityIcons name={(selectedCat?.icon || "tag-outline") as any} size={24} color={selectedCat?.color || colors.primary} />
                  </View>
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>{selectedCat?.name}</Text>
                </View>
                
                {selectedCat && selectedCat.budget > 0 && (() => {
                  const pct = Math.min((selectedCat.spent / selectedCat.budget) * 100, 100);
                  const isOver = selectedCat.spent >= selectedCat.budget;
                  const barColor = isOver ? colors.error : pct >= 80 ? colors.warning : colors.primary;
                  return (
                    <View style={[styles.budgetInfo, { backgroundColor: colors.card, borderColor: barColor + "30" }]}>
                      <View style={styles.budgetInfoHeader}>
                        <Text style={[styles.budgetInfoLabel, { color: colors.textSecondary }]}>Budget used</Text>
                        <Text style={[styles.budgetInfoPct, { color: barColor }]}>{pct.toFixed(0)}%</Text>
                      </View>
                      <View style={[styles.progressBackground, { height: 6, backgroundColor: colors.borderLight }]}>
                        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                      </View>
                      <Text style={[styles.budgetInfoSub, { color: isOver ? colors.error : colors.textSecondary }]}>
                        {isOver ? `Over by ${formatCurrency(selectedCat.spent - selectedCat.budget, currency)}` : `${formatCurrency(selectedCat.budget - selectedCat.spent, currency)} remaining`}
                      </Text>
                    </View>
                  );
                })()}

                <View style={styles.modalForm}>
                  <View style={styles.modalInputGroup}>
                    <Text style={[styles.modalLabel, { color: colors.textTertiary }]}>AMOUNT</Text>
                    <TextInput 
                      value={amount} 
                      onChangeText={setAmount} 
                      placeholder="0.00" 
                      placeholderTextColor={colors.border} 
                      keyboardType="decimal-pad" 
                      autoFocus 
                      style={[styles.modalInput, { backgroundColor: colors.card, color: colors.text }]} 
                    />
                  </View>
                  
                  <View style={styles.modalInputGroup}>
                    <Text style={[styles.modalLabel, { color: colors.textTertiary }]}>DESCRIPTION (OPTIONAL)</Text>
                    <TextInput 
                      value={description} 
                      onChangeText={setDescription} 
                      placeholder="e.g. Lunch" 
                      placeholderTextColor={colors.border} 
                      style={[styles.modalInput, { backgroundColor: colors.card, color: colors.text }]} 
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                      <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <PayWithFlutterwave
                      onRedirect={async (data: FlwRedirectParams) => {
                        if (data.status === "successful" && data.transaction_id && selectedCat) {
                          setSubmitting(true);
                          try {
                            const parsed = parseFloat(amount);
                            await apiClient.post("/payments/verify", { 
                              transaction_id: data.transaction_id, 
                              tx_ref: data.tx_ref, 
                              payment_type: "expense", 
                              category_id: selectedCat.id, 
                              month: new Date().getMonth() + 1, 
                              year: new Date().getFullYear(), 
                              description: description.trim() || undefined 
                            });
                            await refreshTransactions();
                            setModalVisible(false);
                            const newPct = selectedCat.budget > 0 ? ((selectedCat.spent + parsed) / selectedCat.budget) * 100 : 0;
                            if (newPct >= 100) notifyCategoryWarning(selectedCat.name, 100);
                            else if (newPct >= 80) notifyCategoryWarning(selectedCat.name, newPct);
                          } catch (e: any) { Alert.alert("Error", e.message || "Failed"); }
                          finally { setSubmitting(false); }
                        } else { Alert.alert("Cancelled", "Payment not completed."); }
                      }}
                      options={buildFlwOptions({ 
                        amount: parseFloat(amount) || 0, 
                        currency, 
                        customerEmail: user?.email || "user@spendtrack.app", 
                        customerName: user?.full_name || "User", 
                        description: `${selectedCat?.name}${description ? " — " + description : ""}`, 
                        type: "expense" 
                      }) as FlwOptions}
                      customButton={(props) => (
                        <TouchableOpacity 
                          style={[styles.modalButton, styles.confirmBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]} 
                          onPress={props.onPress} 
                          disabled={!amount.trim() || parseFloat(amount) <= 0 || submitting}
                        >
                          {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.confirmBtnText}>Pay & Add</Text>}
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
  },
  brandName: {
    fontSize: 18,
    fontWeight: "800",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  scrollContent: {
    flexGrow: 1,
  },
  balanceSection: {
    height: 240,
    paddingHorizontal: 24,
    paddingTop: 32,
    overflow: "hidden",
  },
  balanceBlob: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  blob1: {
    width: 200,
    height: 200,
    top: -60,
    right: -40,
  },
  blob2: {
    width: 150,
    height: 150,
    bottom: -40,
    left: -20,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFF",
    marginBottom: 32,
  },
  balanceGrid: {
    flexDirection: "row",
    gap: 24,
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  balanceIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  balanceSubLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 0.5,
  },
  balanceSubValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  mainContent: {
    flex: 1,
    marginTop: -40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  insightBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  goalCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  goalPct: {
    fontSize: 14,
    fontWeight: "900",
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  cardSub: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  catRow: {
    marginBottom: 16,
  },
  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  catLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  catName: {
    fontSize: 14,
    fontWeight: "700",
  },
  catValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  miniBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  miniBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  chartLegend: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  chart: {
    marginLeft: -16,
    marginTop: 8,
  },
  emptyChart: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChartText: {
    fontSize: 14,
    fontWeight: "600",
  },
  aiSection: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  aiSectionHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  aiSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  aiSectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  aiLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  aiLoadingText: {
    fontSize: 13,
    fontWeight: "600",
  },
  aiTipCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  aiTipContent: {
    flex: 1,
  },
  aiTipTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  aiTipBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  aiChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
  },
  aiChatButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 28,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },

  fabLabel: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bottomSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 48,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sheetIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  budgetInfo: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
    gap: 8,
  },
  budgetInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  budgetInfoLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  budgetInfoPct: {
    fontSize: 14,
    fontWeight: "900",
  },
  budgetInfoSub: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalForm: {
    marginTop: 24,
    gap: 16,
  },
  modalInputGroup: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    paddingHorizontal: 8,
  },
  modalInput: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  confirmBtn: {
    shadowColor: "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  planAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  planAmountLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  planAmountInput: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    marginHorizontal: 8,
  },
  planAmountValue: {
    fontSize: 14,
    fontWeight: "700",
    marginHorizontal: 8,
  },
  editButton: {
    padding: 4,
  },
});
