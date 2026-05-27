import FontAwesome from "@expo/vector-icons/FontAwesome";
import TopBar from "@/components/TopBar";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { useAuth } from "@/context/AuthContext";
import { useTheme, type ThemeType, type CurrencyType } from "@/context/ThemeContext";
import { apiClient } from "@/services/api";

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#006859";
const ON_PRIMARY = "#ffffff";
const SECONDARY = "#006c49";
const SECONDARY_CONTAINER = "#6cf8bb";
const PRIMARY_FIXED = "#9af3de";
const PRIMARY_FIXED_DIM = "#7ed6c2";
const SECONDARY_FIXED = "#6ffbbe";
const TERTIARY_FIXED = "#ffdad2";
const SURFACE = "#f6faf7";
const SURFACE_LOWEST = "#ffffff";
const SURFACE_CONTAINER = "#ebefec";
const SURFACE_CONTAINER_LOW = "#f1f4f2";
const SURFACE_CONTAINER_HIGH = "#e5e9e6";
const SURFACE_CONTAINER_HIGHEST = "#dfe3e1";
const ON_SURFACE = "#181d1b";
const ON_SURFACE_VARIANT = "#3e4946";
const OUTLINE = "#6e7a76";
const OUTLINE_VARIANT = "#bdc9c4";
const ERROR = "#ba1a1a";
const ERROR_CONTAINER = "#ffdad6";

const CURRENCIES: { code: CurrencyType; name: string; symbol: string }[] = [
  { code: "RWF", name: "Rwandan Franc", symbol: "Frw" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
];

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { theme, setTheme, currency, setCurrency } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [currencyModal, setCurrencyModal] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<CurrencyType>(currency as CurrencyType);

  const initials = (user?.full_name || user?.email || "U").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    Alert.alert("Logout", "Sign out of your account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
    ]);
  };

  const handleClearData = () => {
    Alert.alert("Clear All Data", "This will permanently delete all your transactions and categories. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Everything", style: "destructive", onPress: () => Alert.alert("Not implemented", "Contact support to delete your account.") },
    ]);
  };

  const confirmCurrency = async () => {
    await setCurrency(pendingCurrency);
    // Also update on backend
    try { await apiClient.put("/users/me", { currency: pendingCurrency }); } catch {}
    setCurrencyModal(false);
  };

  const buildTransactionPdfHtml = (items: any[]) => {
    const rows = items.map((tx) => `
      <tr>
        <td>${tx.created_at || tx.date || ""}</td>
        <td>${tx.type || ""}</td>
        <td>${tx.category || ""}</td>
        <td>${tx.amount != null ? tx.amount : ""}</td>
        <td>${tx.description || tx.title || ""}</td>
        <td>${tx.source || ""}</td>
        <td>${tx.status || ""}</td>
      </tr>`).join("");

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 20px; }
            h1 { color: #006859; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #f1f4f2; }
            tr:nth-child(even) { background: #fbfcfb; }
            .summary { margin-top: 16px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>SpendTrack Transaction Export</h1>
          <p class="summary">Exported ${items.length} transaction${items.length === 1 ? "" : "s"}.</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>`;
  };
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get<any>('/transactions?limit=1000&offset=0');
      const transactions = response.data?.items || [];
      if (!transactions.length) {
        Alert.alert('Export complete', 'No transactions were found to export.');
        return;
      }
      const html = buildTransactionPdfHtml(transactions);
      const { uri } = await Print.printToFileAsync({ html });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Export failed', 'Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share SpendTrack PDF',
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      Alert.alert('Export failed', error?.message || 'Unable to export your data. Please try again later.');
    } finally {
      setIsExporting(false);
    }
  };

  const curObj = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  return (
    <SafeAreaView style={s.safe}>
      <TopBar title="Settings" />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Account ── */}
        <Text style={s.sectionLabel}>ACCOUNT</Text>
        <View style={s.card}>
          <SettingRow
            iconBg={PRIMARY_FIXED} icon="user" iconColor="#005144"
            title="Profile" sub="Update your personal information"
            onPress={() => router.push("/profile")}
            right={<FontAwesome name="chevron-right" size={14} color={OUTLINE_VARIANT} />}
          />
          <Divider />
          <SettingRow
            iconBg={SECONDARY_FIXED} icon="money" iconColor="#005236"
            title="Currency" sub={`${curObj.name} (${curObj.symbol})`}
            onPress={() => { setPendingCurrency(currency as CurrencyType); setCurrencyModal(true); }}
            right={<FontAwesome name="chevron-right" size={14} color={OUTLINE_VARIANT} />}
          />
          <Divider />
          <SettingRow
            iconBg={ERROR_CONTAINER} icon="sign-out" iconColor={ERROR}
            title="Logout" titleColor={ERROR} sub="Sign out of your account"
            onPress={handleLogout}
          />
        </View>

        {/* ── Preferences ── */}
        <Text style={s.sectionLabel}>PREFERENCES</Text>
        <View style={s.card}>
          <SettingRow
            iconBg={PRIMARY_FIXED_DIM} icon="bell" iconColor="#005144"
            title="Notifications" sub="Transaction alerts and reminders"
            right={
              <Switch
                value={notificationsOn}
                onValueChange={setNotificationsOn}
                trackColor={{ false: OUTLINE_VARIANT, true: PRIMARY }}
                thumbColor={ON_PRIMARY}
              />
            }
          />
          <Divider />
          <SettingRow
            iconBg={SURFACE_CONTAINER_HIGHEST} icon="moon-o" iconColor={ON_SURFACE_VARIANT}
            title="Dark Mode" sub={theme === "system" ? "Follow system" : theme === "dark" ? "On" : "Off"}
            right={
              <View style={s.themeToggle}>
                {(["system", "light", "dark"] as ThemeType[]).map((t) => (
                  <Pressable key={t} style={[s.themeBtn, theme === t && s.themeBtnActive]} onPress={() => setTheme(t)}>
                    <Text style={[s.themeBtnText, theme === t && { color: PRIMARY }]}>
                      {t === "system" ? "Auto" : t === "light" ? "Off" : "On"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            }
          />
          <Divider />
          <SettingRow
            iconBg={TERTIARY_FIXED} icon="lock" iconColor="#753323"
            title="Security" sub="Biometric Authentication"
            right={<Switch value={false} trackColor={{ false: OUTLINE_VARIANT, true: PRIMARY }} thumbColor={ON_PRIMARY} />}
          />
        </View>

        {/* ── Data Management ── */}
        <Text style={s.sectionLabel}>DATA MANAGEMENT</Text>
        <View style={s.card}>
          <SettingRow
            iconBg={SURFACE_CONTAINER_LOW} icon="download" iconColor={ON_SURFACE_VARIANT}
            title="Export Data" sub="Download transaction history"
            onPress={handleExportData}
            right={<FontAwesome name="chevron-right" size={14} color={OUTLINE_VARIANT} />}
          />
          <Divider />
          <SettingRow
            iconBg={SURFACE_CONTAINER_LOW} icon="upload" iconColor={ON_SURFACE_VARIANT}
            title="Import Data" sub="Import transactions from file"
            onPress={() => Alert.alert("Coming soon", "Import feature is coming soon.")}
            right={<FontAwesome name="chevron-right" size={14} color={OUTLINE_VARIANT} />}
          />
          <Divider />
          <SettingRow
            iconBg={ERROR_CONTAINER} icon="trash" iconColor={ERROR}
            title="Clear All Data" titleColor={ERROR} sub="Permanently delete everything"
            onPress={handleClearData}
          />
        </View>

        {/* ── Support ── */}
        <Text style={s.sectionLabel}>SUPPORT</Text>
        <View style={s.card}>
          <SettingRow
            iconBg={SECONDARY_CONTAINER + "50"} icon="question-circle" iconColor={SECONDARY}
            title="Help & Support"
            right={<FontAwesome name="external-link" size={14} color={OUTLINE_VARIANT} />}
            onPress={() => Alert.alert("Support", "Email: support@spendtrack.app")}
          />
          <Divider />
          <SettingRow
            iconBg={SECONDARY_CONTAINER + "50"} icon="shield" iconColor={SECONDARY}
            title="Privacy Policy"
            right={<FontAwesome name="chevron-right" size={14} color={OUTLINE_VARIANT} />}
          />
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerCircle}>
            <FontAwesome name="user" size={32} color={PRIMARY} style={{ opacity: 0.3 }} />
          </View>
          <Text style={s.footerVersion}>SpendTrack v1.0.0</Text>
          <Text style={s.footerSub}>Made with care in Kigali</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {isExporting && (
        <View style={s.exportOverlay} pointerEvents="none">
          <View style={s.exportBox}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={s.exportText}>Preparing export…</Text>
          </View>
        </View>
      )}

      {/* Currency modal */}
      <Modal visible={currencyModal} animationType="slide" transparent onRequestClose={() => setCurrencyModal(false)}>
        <View style={s.modalOverlay}>
          <Pressable style={s.modalBackdrop} onPress={() => setCurrencyModal(false)} />
          <View style={s.modalSheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Select Currency</Text>
            <Text style={s.sheetSub}>Choose your primary account currency</Text>
            <ScrollView style={{ maxHeight: 320, marginBottom: 20 }} showsVerticalScrollIndicator={false}>
              {CURRENCIES.map((c) => {
                const selected = pendingCurrency === c.code;
                return (
                  <Pressable
                    key={c.code}
                    style={[s.currencyRow, selected && s.currencyRowSelected]}
                    onPress={() => setPendingCurrency(c.code)}
                  >
                    <View style={[s.currencySymbol, selected && { backgroundColor: PRIMARY }]}>
                      <Text style={[s.currencySymbolText, selected && { color: ON_PRIMARY }]}>{c.symbol}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.currencyName}>{c.name}</Text>
                      <Text style={[s.currencyCode, { color: selected ? PRIMARY : OUTLINE }]}>{c.code}</Text>
                    </View>
                    {selected && <FontAwesome name="check-circle" size={20} color={PRIMARY} />}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable style={s.confirmBtn} onPress={confirmCurrency}>
              <Text style={s.confirmBtnText}>Confirm Selection</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingRow({ iconBg, icon, iconColor, title, titleColor, sub, onPress, right }: any) {
  return (
    <Pressable style={({ pressed }) => [s.row, pressed && onPress && { backgroundColor: SURFACE_CONTAINER_LOW }]} onPress={onPress}>
      <View style={[s.rowIcon, { backgroundColor: iconBg }]}>
        <FontAwesome name={icon} size={20} color={iconColor} />
      </View>
      <View style={s.rowText}>
        <Text style={[s.rowTitle, titleColor && { color: titleColor }]}>{title}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      {right && <View style={s.rowRight}>{right}</View>}
    </Pressable>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SURFACE },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, backgroundColor: SURFACE_CONTAINER_LOW },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY_FIXED, justifyContent: "center", alignItems: "center" },
  avatarText: { fontWeight: "700", fontSize: 14, color: "#00201a" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: PRIMARY },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  sectionLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1, color: OUTLINE, marginBottom: 10, paddingHorizontal: 4 },
  card: { backgroundColor: SURFACE_LOWEST, borderRadius: 16, overflow: "hidden", marginBottom: 24, shadowColor: "#006859", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },

  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  rowIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "600", color: ON_SURFACE },
  rowSub: { fontSize: 13, fontWeight: "600", color: ON_SURFACE_VARIANT, marginTop: 1 },
  rowRight: { alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: SURFACE_CONTAINER, marginLeft: 78 },

  themeToggle: { flexDirection: "row", backgroundColor: SURFACE_CONTAINER_LOW, borderRadius: 8, padding: 3 },
  themeBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  themeBtnActive: { backgroundColor: SURFACE_LOWEST, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  themeBtnText: { fontSize: 12, fontWeight: "800", color: OUTLINE },

  footer: { alignItems: "center", paddingVertical: 24, opacity: 0.6 },
  footerCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: SECONDARY_CONTAINER + "30", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  footerVersion: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5, color: OUTLINE },
  footerSub: { fontSize: 13, fontWeight: "600", color: OUTLINE_VARIANT, marginTop: 4 },

  // Currency modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { backgroundColor: SURFACE_LOWEST, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingBottom: 48 },
  sheetHandle: { width: 48, height: 5, backgroundColor: OUTLINE_VARIANT, borderRadius: 3, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: "700", color: ON_SURFACE, marginBottom: 4 },
  sheetSub: { fontSize: 13, fontWeight: "600", color: ON_SURFACE_VARIANT, marginBottom: 20 },
  currencyRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: SURFACE_CONTAINER, marginBottom: 8 },
  currencyRowSelected: { backgroundColor: PRIMARY + "10", borderColor: PRIMARY + "30" },
  currencySymbol: { width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE_CONTAINER, justifyContent: "center", alignItems: "center" },
  currencySymbolText: { fontSize: 14, fontWeight: "700", color: ON_SURFACE_VARIANT },
  currencyName: { fontSize: 16, fontWeight: "600", color: ON_SURFACE },
  currencyCode: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  confirmBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  confirmBtnText: { fontSize: 16, fontWeight: "600", color: ON_PRIMARY },
  exportOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.18)" },
  exportBox: { backgroundColor: SURFACE_LOWEST, padding: 20, borderRadius: 18, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
  exportText: { marginTop: 12, fontSize: 15, fontWeight: "600", color: ON_SURFACE },
});
