import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { BalanceCard } from "@/components/BalanceCard";
import { useTransactions } from "@/context/TransactionsContext";
import { useTheme } from "@/context/ThemeContext";
import { formatCurrency } from "@/utils/money";

function TopBar() {
  const { colors } = useTheme();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleProfilePress = () => {
    router.push("/profile");
  };

  const handleNotificationsPress = () => {
    router.push("/notifications");
  };

  const handleSearchPress = () => {
    setIsSearchActive(!isSearchActive);
    if (isSearchActive) {
      setSearchQuery("");
    }
  };

  return (
    <View style={styles.topBar}>
      <View style={styles.profileSection}>
        <Pressable onPress={handleProfilePress} style={styles.profileButton}>
          <View style={styles.profilePhoto}>
            <FontAwesome name="user" size={20} color="#FFFFFF" />
          </View>
        </Pressable>
        <Text style={[styles.username, { color: colors.text }]}>John Doe</Text>
      </View>
      <View style={styles.actions}>
        {isSearchActive ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search transactions..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              onBlur={() => setIsSearchActive(false)}
            />
            <Pressable
              onPress={handleSearchPress}
              style={styles.searchCloseButton}
            >
              <FontAwesome name="times" size={16} color="#6B7280" />
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable
              onPress={handleSearchPress}
              style={[styles.iconButton, { backgroundColor: colors.surface }]}
            >
              <FontAwesome name="search" size={20} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={handleNotificationsPress}
              style={[styles.iconButton, { backgroundColor: colors.surface }]}
            >
              <FontAwesome name="bell" size={20} color={colors.text} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function MonthlySavings() {
  const { transactions } = useTransactions();
  const { colors, currency } = useTheme();

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];

    // Generate data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return `${tDate.getFullYear()}-${tDate.getMonth()}` === monthKey;
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const savings = income - expenses;
      const isCurrentMonth = i === 5;

      // Mock target for current month - in real app this would come from user settings
      const target = isCurrentMonth ? 3000 : null;

      months.push({
        month: monthName,
        savings,
        target,
        isCurrentMonth,
        monthKey,
      });
    }

    return months;
  }, [transactions]);

  const renderMonthCard = ({ item }: { item: any }) => {
    if (item.isCurrentMonth && item.target) {
      const percentage = Math.min((item.savings / item.target) * 100, 100);
      return (
        <View style={[styles.savingsCard, styles.currentMonthCard]}>
          <Text style={[styles.savingsMonth, styles.currentMonthText]}>
            {item.month}
          </Text>
          <Text style={[styles.savingsAmount, styles.currentMonthText]}>
            {formatCurrency(item.savings, currency)} /{" "}
            {formatCurrency(item.target, currency)}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percentage}%` }]} />
          </View>
          <Text style={[styles.savingsLabel, styles.currentMonthText]}>
            Target Progress
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.savingsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.savingsMonth, { color: colors.textSecondary }]}>
          {item.month}
        </Text>
        <Text
          style={[
            styles.savingsAmount,
            item.savings >= 0 ? styles.positiveSavings : styles.negativeSavings,
          ]}
        >
          {formatCurrency(item.savings, currency)}
        </Text>
        <Text style={[styles.savingsLabel, { color: colors.textSecondary }]}>
          Saved
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.monthlySavingsContainer}>
      <FlatList
        horizontal
        data={monthlyData}
        keyExtractor={(item) => item.monthKey}
        renderItem={renderMonthCard}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthlySavingsList}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />
    </View>
  );
}

function CategoryItem({
  category,
  spent,
  budget,
  percentage,
  iconName,
  color,
}: {
  category: string;
  spent: number;
  budget: number;
  percentage: number;
  iconName: string;
  color: string;
}) {
  const { colors, currency } = useTheme();
  const isOverBudget = spent > budget;

  return (
    <View style={[styles.categoryItem, { backgroundColor: colors.card }]}>
      <View style={[styles.categoryIcon, { backgroundColor: color }]}>
        <FontAwesome name={iconName as any} size={16} color="#FFFFFF" />
      </View>
      <View style={styles.categoryInfo}>
        <View style={styles.categoryHeader}>
          <Text style={[styles.categoryName, { color: colors.text }]}>
            {category}
          </Text>
          <Text
            style={[styles.categoryPercentage, { color: colors.textSecondary }]}
          >
            {percentage.toFixed(0)}%
          </Text>
        </View>
        <Text style={[styles.categorySpent, { color: colors.textSecondary }]}>
          {formatCurrency(spent, currency)} / {formatCurrency(budget, currency)}
        </Text>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBackground,
              { backgroundColor: colors.borderLight },
            ]}
          >
            <View
              style={[
                styles.categoryProgressFill,
                { width: `${Math.min(percentage, 100)}%` },
                isOverBudget && styles.overBudgetProgress,
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { transactions, totals } = useTransactions();
  const { colors } = useTheme();

  const categoryData = useMemo(() => {
    // Dummy categories with budgets and icons
    const dummyCategories = [
      { name: "Food", budget: 800, icon: "cutlery", color: "#EF4444" },
      { name: "Transport", budget: 400, icon: "car", color: "#3B82F6" },
      { name: "Shopping", budget: 600, icon: "shopping-bag", color: "#8B5CF6" },
      { name: "Entertainment", budget: 300, icon: "film", color: "#F59E0B" },
      { name: "Bills", budget: 500, icon: "home", color: "#10B981" },
      { name: "Health", budget: 200, icon: "heartbeat", color: "#EC4899" },
    ];

    // Calculate actual spending from transactions
    const spending: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      });

    return dummyCategories.map((cat) => {
      const spent = spending[cat.name] || 0;
      const percentage = cat.budget > 0 ? (spent / cat.budget) * 100 : 0;
      return {
        category: cat.name,
        spent,
        budget: cat.budget,
        percentage,
        iconName: cat.icon,
        color: cat.color,
      };
    });
  }, [transactions]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar />

        <MonthlySavings />

        <BalanceCard
          balance={totals.balance}
          income={totals.income}
          expenses={totals.expenses}
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Spending Categories
          </Text>
        </View>

        <FlatList
          data={categoryData}
          keyExtractor={(item) => item.category}
          renderItem={({ item }) => (
            <CategoryItem
              category={item.category}
              spent={item.spent}
              budget={item.budget}
              percentage={item.percentage}
              iconName={item.iconName}
              color={item.color}
            />
          )}
          contentContainerStyle={
            categoryData.length === 0 ? styles.emptyList : undefined
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No spending categories yet. Add some expenses to see them here.
            </Text>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileButton: {
    marginRight: 12,
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 200,
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
  },
  searchCloseButton: {
    marginLeft: 8,
    padding: 4,
  },
  monthlySavingsContainer: {
    marginBottom: 16,
  },
  monthlySavingsList: {
    paddingHorizontal: 16,
  },
  savingsCard: {
    width: 140,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  currentMonthCard: {
    backgroundColor: "#3B82F6",
  },
  currentMonthText: {
    color: "#FFFFFF",
  },
  savingsMonth: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  savingsAmount: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  positiveSavings: {
    color: "#059669",
  },
  negativeSavings: {
    color: "#EF4444",
  },
  savingsLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 4,
    width: "100%",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  categorySpent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  progressContainer: {
    width: "100%",
  },
  progressBackground: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
  },
  categoryProgressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  overBudgetProgress: {
    backgroundColor: "#EF4444",
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 24,
  },
});
