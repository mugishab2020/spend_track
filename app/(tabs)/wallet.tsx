import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Wallet</Text>
        <Text style={styles.subtitle}>
          Manage your wallet and accounts here.
        </Text>
        {/* Add wallet management components here */}
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
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});
