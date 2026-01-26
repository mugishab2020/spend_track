import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/utils/money";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  transaction: Transaction;
};

export function TransactionItem({ transaction }: Props) {
  const { currency } = useTheme();
  const sign = transaction.type === "expense" ? "-" : "+";
  const amountColor =
    transaction.type === "expense" ? styles.expense : styles.income;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text numberOfLines={1} style={styles.title}>
          {transaction.title}
        </Text>
        <Text style={styles.meta}>
          {transaction.category} •{" "}
          {new Date(transaction.date).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.amount, amountColor]}>
        {sign}
        {formatCurrency(transaction.amount, currency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  amount: {
    fontSize: 15,
    fontWeight: "800",
  },
  income: {
    color: "#059669",
  },
  expense: {
    color: "#DC2626",
  },
});
