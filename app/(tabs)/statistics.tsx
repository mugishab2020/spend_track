import React, { useMemo } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTransactions } from "@/context/TransactionsContext";
import { useTheme } from "@/context/ThemeContext";
import { formatCurrency } from "@/utils/money";

function SimpleBarChart({
  data,
  labels,
}: {
  data: number[];
  labels: string[];
}) {
  const { colors, currency } = useTheme();
  const maxValue = Math.max(...data);

  return (
    <View style={[styles.barChartContainer, { backgroundColor: colors.card }]}>
      {data.map((value, index) => (
        <View key={index} style={styles.barContainer}>
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  height: maxValue > 0 ? (value / maxValue) * 150 : 0,
                  backgroundColor: value >= 0 ? colors.primary : colors.error,
                },
              ]}
            />
          </View>
          <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
            {labels[index]}
          </Text>
          <Text style={[styles.barValue, { color: colors.text }]}>
            {formatCurrency(value, currency)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SimpleLineChart({
  data,
  labels,
}: {
  data: { income: number[]; expenses: number[] };
  labels: string[];
}) {
  const { colors } = useTheme();
  const maxValue = Math.max(...data.income, ...data.expenses);

  return (
    <View style={[styles.lineChartContainer, { backgroundColor: colors.card }]}>
      <View style={styles.lineChartGrid}>
        {data.income.map((income, index) => {
          const expense = data.expenses[index];
          const incomeHeight = maxValue > 0 ? (income / maxValue) * 120 : 0;
          const expenseHeight = maxValue > 0 ? (expense / maxValue) * 120 : 0;

          return (
            <View key={index} style={styles.linePointContainer}>
              <View style={styles.linePointWrapper}>
                <View
                  style={[
                    styles.linePoint,
                    {
                      bottom: incomeHeight,
                      backgroundColor: colors.chartIncome,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.linePoint,
                    {
                      bottom: expenseHeight,
                      backgroundColor: colors.chartExpense,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.lineLabel, { color: colors.textSecondary }]}>
                {labels[index]}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.lineLegend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: colors.chartIncome },
            ]}
          />
          <Text style={[styles.legendText, { color: colors.text }]}>
            Income
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: colors.chartExpense },
            ]}
          />
          <Text style={[styles.legendText, { color: colors.text }]}>
            Expenses
          </Text>
        </View>
      </View>
    </View>
  );
}

function SimplePieChart({
  data,
}: {
  data: Array<{ name: string; amount: number; color: string }>;
}) {
  const { colors, currency } = useTheme();
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={[styles.pieChartContainer, { backgroundColor: colors.card }]}>
      <View style={styles.pieChartGrid}>
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.amount / total) * 100 : 0;
          return (
            <View key={index} style={styles.pieItem}>
              <View style={styles.pieItemLeft}>
                <View
                  style={[styles.pieColor, { backgroundColor: item.color }]}
                />
                <Text style={[styles.pieLabel, { color: colors.text }]}>
                  {item.name}
                </Text>
              </View>
              <View style={styles.pieItemRight}>
                <Text style={[styles.pieAmount, { color: colors.text }]}>
                  {formatCurrency(item.amount, currency)}
                </Text>
                <Text
                  style={[
                    styles.piePercentage,
                    { color: colors.textSecondary },
                  ]}
                >
                  {percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.summaryCard,
        { borderLeftColor: color, backgroundColor: colors.card },
      ]}
    >
      <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function StatisticsScreen() {
  const { transactions } = useTransactions();
  const { colors, currency } = useTheme();

  const chartData = useMemo(() => {
    // Generate last 6 months of data
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
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

      months.push({
        month: monthName,
        income,
        expenses,
        savings: income - expenses,
      });
    }

    return months;
  }, [transactions]);

  const categoryData = useMemo(() => {
    const spending: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      });

    const colors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
    ];
    return Object.entries(spending).map(([category, amount], index) => ({
      name: category,
      amount,
      color: colors[index % colors.length],
      legendFontColor: "#333",
      legendFontSize: 12,
    }));
  }, [transactions]);

  const totalIncome = chartData.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = chartData.reduce(
    (sum, month) => sum + month.expenses,
    0,
  );
  const totalSavings = totalIncome - totalExpenses;

  const chartConfig = {
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <SummaryCard
            title="Total Income"
            value={formatCurrency(totalIncome, currency)}
            color="#10B981"
          />
          <SummaryCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses, currency)}
            color="#EF4444"
          />
          <SummaryCard
            title="Net Savings"
            value={formatCurrency(totalSavings, currency)}
            color="#3B82F6"
          />
        </View>

        {/* Income vs Expenses Line Chart */}
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Income vs Expenses Trend
          </Text>
          <SimpleLineChart
            data={{
              income: chartData.map((d) => d.income),
              expenses: chartData.map((d) => d.expenses),
            }}
            labels={chartData.map((d) => d.month)}
          />
        </View>

        {/* Savings Bar Chart */}
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Monthly Savings
          </Text>
          <SimpleBarChart
            data={chartData.map((d) => d.savings)}
            labels={chartData.map((d) => d.month)}
          />
        </View>

        {/* Spending by Category Pie Chart */}
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Spending by Category
          </Text>
          <SimplePieChart data={categoryData} />
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  chartContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  chart: {
    borderRadius: 12,
  },
  spacer: {
    height: 20,
  },
  barChartContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
  },
  barWrapper: {
    height: 150,
    width: 30,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: 25,
    borderRadius: 4,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
  barValue: {
    fontSize: 10,
    color: "#475569",
    marginTop: 4,
    textAlign: "center",
  },
  lineChartContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lineChartGrid: {
    height: 140,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  linePointContainer: {
    alignItems: "center",
    flex: 1,
  },
  linePointWrapper: {
    height: 120,
    width: 40,
    position: "relative",
  },
  linePoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    left: "50%",
    marginLeft: -4,
  },
  lineLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
  lineLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: "#475569",
  },
  pieChartContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pieChartGrid: {
    gap: 12,
  },
  pieItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pieItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pieColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  pieLabel: {
    fontSize: 16,
    color: "#1E293B",
    flex: 1,
  },
  pieItemRight: {
    alignItems: "flex-end",
  },
  pieAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  piePercentage: {
    fontSize: 14,
    color: "#64748B",
  },
});
