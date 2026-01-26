import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatCurrency } from "@/utils/money";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  balance: number;
  income: number;
  expenses: number;
};

export function BalanceCard({ balance, income, expenses }: Props) {
  const { currency } = useTheme();

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Total Balance</Text>
      <Text style={styles.balance}>{formatCurrency(balance, currency)}</Text>

      <View style={styles.row}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Income</Text>
          <Text style={[styles.metricValue, styles.income]}>
            {formatCurrency(income, currency)}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Expenses</Text>
          <Text style={[styles.metricValue, styles.expense]}>
            {formatCurrency(expenses, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#6366F1", // Changed from dark to purple/indigo
    borderRadius: 20,
    padding: 20,
    shadowColor: "#6366F1",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  balance: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  metric: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  metricValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "800",
  },
  income: {
    color: "#34D399",
  },
  expense: {
    color: "#F87171",
  },
});
