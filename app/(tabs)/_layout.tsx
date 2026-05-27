import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

const SECONDARY_CONTAINER = "#6cf8bb";
const ON_SECONDARY_CONTAINER = "#00714d";
const ON_SURFACE_VARIANT = "#3e4946";
const SURFACE_BRIGHT = "#f6faf7";
const OUTLINE_VARIANT = "#bdc9c4";
const PRIMARY = "#006859";

function TabIcon({ name, label, focused, isAdd = false }: {
  name: any; label: string; focused: boolean; isAdd?: boolean;
}) {
  if (isAdd) {
    return (
      <View style={s.itemWrap}>
        <View style={[s.addCircle, focused && { borderColor: PRIMARY, backgroundColor: PRIMARY }]}> 
          <FontAwesome name="plus" size={18} color={focused ? "#ffffff" : ON_SURFACE_VARIANT} />
        </View>
        <Text style={[s.label, { color: focused ? PRIMARY : ON_SURFACE_VARIANT }]} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      </View>
    );
  }
  if (focused) {
    return (
      <View style={s.activeItem}>
        <FontAwesome name={name} size={24} color={PRIMARY} />
      </View>
    );
  }
  return (
    <View style={[s.itemWrap, s.inactiveItem]}>
      <FontAwesome name={name} size={22} color={ON_SURFACE_VARIANT} />
      <Text style={s.label} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  useProtectedRoute();
  return (
    <Tabs
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: [s.bar, isTablet && s.barLarge],
        tabBarShowLabel: false,
        tabBarItemStyle: s.item,
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* index.tsx  → Home */}
      <Tabs.Screen name="index"    options={{ headerShown: false, tabBarIcon: ({ focused }) => <TabIcon name="home"        label="Home"       focused={focused} /> }} />
      {/* two.tsx    → Categories */}
      <Tabs.Screen name="two"      options={{ headerShown: false, tabBarIcon: ({ focused }) => <TabIcon name="th-large"    label="Categories" focused={focused} /> }} />
      {/* targets.tsx → Add / Goals */}
      <Tabs.Screen name="targets"  options={{ headerShown: false, tabBarIcon: ({ focused }) => <TabIcon name="plus"        label="Add"        focused={focused} isAdd /> }} />
      {/* wallet.tsx  → Wallet */}
      <Tabs.Screen name="wallet"   options={{ headerShown: false, tabBarIcon: ({ focused }) => <TabIcon name="credit-card" label="Wallet"     focused={focused} /> }} />
      {/* settings.tsx → Settings */}
      <Tabs.Screen name="settings" options={{ headerShown: false, tabBarIcon: ({ focused }) => <TabIcon name="cog"         label="Settings"   focused={focused} /> }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: {
    backgroundColor: "#ffffff",
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    borderRadius: 24,
    height: 78,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 16,
  },
  barLarge: {
    height: 94,
    bottom: 20,
    borderRadius: 32,
    paddingHorizontal: 18,
  },
  item: { alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  activeItem: { alignItems: "center", justifyContent: "center", marginTop: 0 },
  inactiveItem: { alignItems: "center", justifyContent: "center", marginTop: 8 },
  pill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: PRIMARY,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, gap: 6,
  },
  pillLabel: { fontSize: 11, fontWeight: "800", color: "#ffffff", letterSpacing: 0.15 },
  itemWrap: { alignItems: "center", justifyContent: "center", gap: 3 },
  label: { fontSize: 9, fontWeight: "800", color: ON_SURFACE_VARIANT, letterSpacing: 0.3, textAlign: "center" },
  addCircle: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 2, borderColor: OUTLINE_VARIANT,
    alignItems: "center", justifyContent: "center", marginBottom: 2,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
});
