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

  const buildFinancialReportPdfHtml = (report: any) => {
    const { month, year, user_profile, summary, categories, saving_goals, alerts, ai_insight, transactions } = report;
    const currency = user_profile?.currency || "RWF";
    
    // Format Month
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[month - 1] || String(month);

    // 1. Transaction Rows
    const transactionRows = (transactions || []).map((tx: any) => {
      const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "";
      const typeLabel = tx.type === "income" ? "Income" : "Expense";
      const badgeColor = tx.type === "income" ? "#e6f4ea" : "#fce8e6";
      const textColor = tx.type === "income" ? "#137333" : "#c5221f";
      
      return `
        <tr>
          <td>${dateStr}</td>
          <td><span class="badge" style="background-color: ${badgeColor}; color: ${textColor}">${typeLabel}</span></td>
          <td>${tx.category || "Uncategorized"}</td>
          <td style="font-weight: bold; text-align: right;">${tx.amount.toLocaleString()} ${currency}</td>
          <td>${tx.description || ""}</td>
          <td>${tx.source || ""}</td>
          <td>${tx.status || ""}</td>
        </tr>`;
    }).join("");

    // 2. Category Rows
    const categoryRows = (categories || []).map((cat: any) => {
      const capStr = cat.cap_amount ? `${cat.cap_amount.toLocaleString()} ${currency}` : "No limit";
      const spentStr = `${cat.actual_spent.toLocaleString()} ${currency}`;
      const pct = cat.utilization_percentage.toFixed(0);
      const isExceeded = cat.is_exceeded;
      const progressColor = isExceeded ? "#ba1a1a" : cat.utilization_percentage >= 80 ? "#e67e22" : "#006859";
      
      return `
        <tr>
          <td>${cat.name}</td>
          <td style="text-align: right;">${capStr}</td>
          <td style="text-align: right; font-weight: bold;">${spentStr}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="progress-bar-bg" style="width: 100px; height: 6px; background-color: #e5e9e6; border-radius: 3px; overflow: hidden; display: inline-block;">
                <div class="progress-bar-fill" style="width: ${Math.min(cat.utilization_percentage, 100)}%; height: 100%; border-radius: 3px; background-color: ${progressColor};"></div>
              </div>
              <span style="font-size: 11px; font-weight: bold; color: ${progressColor}">${pct}%</span>
            </div>
            ${isExceeded ? '<span style="color: #ba1a1a; font-size: 10px; font-weight: bold; display: block; margin-top: 2px;">Over budget!</span>' : ''}
          </td>
        </tr>`;
    }).join("");

    // 3. Saving Goals
    const savingGoalItems = (saving_goals || []).map((goal: any) => {
      const targetStr = goal.target_amount ? `${goal.target_amount.toLocaleString()} ${currency}` : "";
      const percentStr = goal.target_percentage ? `${goal.target_percentage}%` : "";
      const detail = targetStr && percentStr ? `${targetStr} (${percentStr})` : targetStr || percentStr || "N/A";
      return `<div class="list-item" style="background-color: #f6faf7; border: 1px solid #bdc9c4; border-radius: 8px; padding: 12px; font-size: 13px; margin-bottom: 8px;"><strong>Saving Goal Target:</strong> ${detail}</div>`;
    }).join("");

    // 4. Alerts
    const alertItems = (alerts || []).map((alt: any) => {
      const dateStr = alt.created_at ? new Date(alt.created_at).toLocaleDateString() : "";
      return `
        <div class="list-item alert-item" style="background-color: #f6faf7; border: 1px solid #bdc9c4; border-left: 4px solid #ba1a1a; border-radius: 8px; padding: 12px; font-size: 13px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #c5221f;">${alt.title}</strong>
            <span style="font-size: 11px; color: #6e7a76;">${dateStr}</span>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 12px;">${alt.message}</p>
        </div>`;
    }).join("");

    // 5. AI Insights
    const aiInsightHtml = ai_insight ? `
      <div class="ai-box" style="background-color: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 12px; padding: 18px; margin-top: 16px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 18px;">✨</span>
          <h3 style="margin: 0; color: #006859; font-size: 16px;">AI Summary & suggestions</h3>
        </div>
        <p style="font-size: 13px; line-height: 1.5; margin: 0 0 12px 0;"><strong>Summary:</strong> ${ai_insight.summary}</p>
        <p style="font-size: 13px; line-height: 1.5; margin: 0;"><strong>Suggestions:</strong> ${ai_insight.suggestions}</p>
      </div>` : `
      <div class="ai-box" style="background-color: #f6faf7; border: 1px dashed #bdc9c4; border-radius: 12px; padding: 18px; margin-top: 16px; margin-bottom: 16px; text-align: center; color: #6e7a76;">
        <p style="margin: 0; font-size: 13px;">No AI insights generated for this month yet.</p>
      </div>`;

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #181d1b; background-color: #ffffff; padding: 30px; margin: 0; }
            .header { border-bottom: 2px solid #ebefec; padding-bottom: 20px; margin-bottom: 24px; }
            .header-title { color: #006859; font-size: 26px; font-weight: bold; margin: 0; }
            .header-meta { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; }
            .user-info { font-size: 13px; color: #3e4946; line-height: 1.4; }
            .report-period { font-size: 16px; font-weight: bold; color: #006c49; }
            
            .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
            .card { background-color: #f6faf7; border: 1px solid #bdc9c4; border-radius: 12px; padding: 16px; box-shadow: 0 2px 4px rgba(0, 104, 89, 0.02); }
            .card-label { font-size: 11px; font-weight: bold; color: #6e7a76; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
            .card-value { font-size: 18px; font-weight: bold; color: #181d1b; }
            
            .section-title { font-size: 18px; font-weight: bold; color: #006859; margin: 28px 0 12px 0; padding-bottom: 6px; border-bottom: 1px solid #ebefec; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px; }
            th, td { padding: 12px 10px; text-align: left; font-size: 12px; border-bottom: 1px solid #ebefec; }
            th { background-color: #f1f4f2; color: #3e4946; font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
            tr:nth-child(even) td { background-color: #fbfcfb; }
            
            .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            
            @media (max-width: 600px) {
              .summary-cards { grid-template-columns: 1fr 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="header-title">SpendTrack Financial Report</h1>
            <div class="header-meta">
              <div class="user-info">
                <strong>Name:</strong> ${user_profile?.full_name || "User"}<br/>
                <strong>Email:</strong> ${user_profile?.email || ""}
              </div>
              <div class="report-period">
                ${monthName} ${year}
              </div>
            </div>
          </div>
          
          <div class="summary-cards">
            <div class="card">
              <div class="card-label">Total Income</div>
              <div class="card-value" style="color: #137333;">+${summary?.total_income.toLocaleString()} ${currency}</div>
            </div>
            <div class="card">
              <div class="card-label">Total Expenses</div>
              <div class="card-value" style="color: #c5221f;">-${summary?.total_expenses.toLocaleString()} ${currency}</div>
            </div>
            <div class="card">
              <div class="card-label">Net Savings</div>
              <div class="card-value" style="color: ${summary?.net_savings >= 0 ? '#137333' : '#c5221f'};">
                ${summary?.net_savings >= 0 ? '+' : ''}${summary?.net_savings.toLocaleString()} ${currency}
              </div>
            </div>
            <div class="card">
              <div class="card-label">Savings Rate</div>
              <div class="card-value">${summary?.savings_rate.toFixed(1)}%</div>
            </div>
          </div>
          
          <div class="section-title">AI Financial Insights</div>
          ${aiInsightHtml}
          
          <div class="section-title">Category Budgets & Utilization</div>
          ${categoryRows.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th style="text-align: right;">Limit</th>
                <th style="text-align: right;">Spent</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRows}
            </tbody>
          </table>` : '<p style="font-size: 13px; color: #6e7a76;">No custom categories set up.</p>'}

          ${savingGoalItems.length > 0 ? `
          <div class="section-title">Savings Goals</div>
          <div class="list-container" style="display: flex; flex-direction: column; gap: 8px;">
            ${savingGoalItems}
          </div>` : ''}

          ${alertItems.length > 0 ? `
          <div class="section-title">Recent Alerts</div>
          <div class="list-container" style="display: flex; flex-direction: column; gap: 8px;">
            ${alertItems}
          </div>` : ''}
          
          <div class="section-title">Transaction Details</div>
          ${transactionRows.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th style="text-align: right;">Amount</th>
                <th>Description</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${transactionRows}
            </tbody>
          </table>` : '<p style="font-size: 13px; color: #6e7a76;">No transactions logged for this period.</p>'}
        </body>
      </html>`;
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const response = await apiClient.get<any>(`/reports?month=${month}&year=${year}`);
      const report = response.data || {};
      
      if (!report.summary) {
        Alert.alert('Export failed', 'Report data could not be generated. Please try again later.');
        return;
      }
      
      const html = buildFinancialReportPdfHtml(report);
      const { uri } = await Print.printToFileAsync({ html });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Export failed', 'Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share SpendTrack Report',
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      Alert.alert('Export failed', error?.message || 'Unable to generate financial report. Please try again later.');
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
