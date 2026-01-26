import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert, Modal, FlatList } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";

type SettingItemProps = {
  title: string;
  subtitle?: string;
  icon: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
};

function SettingItem({ title, subtitle, icon, onPress, rightComponent }: SettingItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.borderLight }]} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <FontAwesome name={icon as any} size={20} color={colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent && <View style={styles.settingRight}>{rightComponent}</View>}
    </TouchableOpacity>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { theme, colors, setTheme, isDark, currency, setCurrency } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  ];

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "This will export all your transaction data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export", onPress: () => Alert.alert("Success", "Data exported successfully!") },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your transactions. This action cannot be undone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => Alert.alert("Success", "All data cleared!") },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "About SpendTrack",
      "Version 1.0.0\n\nA simple and intuitive expense tracking app to help you manage your finances.\n\n© 2026 SpendTrack",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <SettingSection title="Account">
          <SettingItem
            title="Profile"
            subtitle="Update your personal information"
            icon="user"
            onPress={() => router.push("/profile")}
          />
          <SettingItem
            title="Currency"
            subtitle={`${currencies.find(c => c.code === currency)?.symbol} ${currency}`}
            icon="dollar"
            onPress={() => setCurrencyModalVisible(true)}
          />
        </SettingSection>

        <SettingSection title="Preferences">
          <SettingItem
            title="Notifications"
            subtitle="Receive transaction alerts and reminders"
            icon="bell"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor={notificationsEnabled ? '#FFFFFF' : '#F1F5F9'}
              />
            }
          />
          <SettingItem
            title="Dark Mode"
            subtitle={theme === 'system' ? 'Follow system' : theme === 'dark' ? 'Enabled' : 'Disabled'}
            icon="moon-o"
            rightComponent={
              <TouchableOpacity
                style={styles.themeSelector}
                onPress={() => {
                  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
                  setTheme(nextTheme);
                }}
              >
                <Text style={[styles.themeText, { color: colors.text }]}>
                  {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
                </Text>
                <FontAwesome
                  name={theme === 'light' ? 'sun-o' : theme === 'dark' ? 'moon-o' : 'mobile'}
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            }
          />
          <SettingItem
            title="Biometric Authentication"
            subtitle="Use fingerprint or face ID"
            icon="lock"
            rightComponent={
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor={biometricEnabled ? '#FFFFFF' : '#F1F5F9'}
              />
            }
          />
        </SettingSection>

        <SettingSection title="Data Management">
          <SettingItem
            title="Export Data"
            subtitle="Download your transaction history"
            icon="download"
            onPress={handleExportData}
          />
          <SettingItem
            title="Import Data"
            subtitle="Import transactions from file"
            icon="upload"
            onPress={() => Alert.alert("Import", "Import feature coming soon!")}
          />
          <SettingItem
            title="Clear All Data"
            subtitle="Permanently delete all transactions"
            icon="trash"
            onPress={handleClearData}
          />
        </SettingSection>

        <SettingSection title="Support">
          <SettingItem
            title="Help & Support"
            subtitle="Get help and contact support"
            icon="question-circle"
            onPress={() => Alert.alert("Help", "Help center coming soon!")}
          />
          <SettingItem
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            icon="shield"
            onPress={() => Alert.alert("Privacy", "Privacy policy coming soon!")}
          />
          <SettingItem
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            icon="file-text-o"
            onPress={() => Alert.alert("Terms", "Terms of service coming soon!")}
          />
        </SettingSection>

        <SettingSection title="About">
          <SettingItem
            title="About SpendTrack"
            subtitle="Version 1.0.0"
            icon="info-circle"
            onPress={handleAbout}
          />
        </SettingSection>

        <View style={styles.spacer} />
      </ScrollView>

      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Currency</Text>
            <FlatList
              data={currencies}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.currencyItem, { borderBottomColor: colors.borderLight }]}
                  onPress={() => {
                    setCurrency(item.code as any);
                    setCurrencyModalVisible(false);
                  }}
                >
                  <Text style={[styles.currencySymbol, { color: colors.primary }]}>{item.symbol}</Text>
                  <View style={styles.currencyText}>
                    <Text style={[styles.currencyCode, { color: colors.text }]}>{item.code}</Text>
                    <Text style={[styles.currencyName, { color: colors.textSecondary }]}>{item.name}</Text>
                  </View>
                  {currency === item.code && (
                    <FontAwesome name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setCurrencyModalVisible(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.surface }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingRight: {
    marginLeft: 12,
  },
  themeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  themeText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  spacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  currencySymbol: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  currencyText: {
    flex: 1,
    marginLeft: 15,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyName: {
    fontSize: 14,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
