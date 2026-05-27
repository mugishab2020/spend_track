import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const { width } = Dimensions.get("window");

export default function LandingScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Background Blobs */}
      <View style={[styles.blob, styles.blob1, { backgroundColor: colors.primaryLight, opacity: 0.2 }]} />
      <View style={[styles.blob, styles.blob2, { backgroundColor: colors.success, opacity: 0.1 }]} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>ST</Text>
          </View>
          <Text style={[styles.brandName, { color: colors.primary }]}>SpendTrack</Text>
        </View>
        <View style={styles.headerRight}>
          {user && (
            <View style={[styles.avatarContainer, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Spend Track</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Your money, smarter.</Text>
        </View>

        {/* Illustration Section */}
        <View style={[styles.illustrationContainer, { backgroundColor: "rgba(111, 251, 190, 0.1)" }]}>
           <Svg height="200" width="200" viewBox="0 0 200 280" style={styles.svgSilhouette}>
            <Circle cx="100" cy="50" r="25" fill={colors.primary} />
            <Path 
              d="M70 85C70 85 55 130 55 160C55 190 75 220 75 220L85 280H115L125 220C125 220 145 190 145 160C145 130 130 85 130 85H70Z" 
              fill={colors.primary} 
            />
            <Rect x="75" y="80" width="50" height="15" rx="7.5" fill={colors.text} opacity={0.3} />
          </Svg>
          
          <View style={styles.locationBadge}>
            <Text style={[styles.locationText, { color: colors.primary }]}>KIGALI, RWANDA</Text>
          </View>
        </View>

        {/* Feature Grid */}
        <View style={styles.featureGrid}>
          {/* Feature 1 */}
          <TouchableOpacity style={[styles.featureCard, { backgroundColor: "#E8FAF1", borderColor: "rgba(0,104,89,0.05)" }]}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(0,104,89,0.1)" }]}>
              <MaterialIcons name="receipt-long" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Track spending</Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                Add expenses, categorize them automatically, and watch your balance grow.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Feature 2 */}
          <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.card, borderColor: "rgba(0,0,0,0.05)" }]}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(0,108,73,0.1)" }]}>
              <MaterialCommunityIcons name="piggy-bank" size={24} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Manage goals</Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                Set saving targets and see progress in real time.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push("/login")}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
              Already have an account? <Text style={[styles.boldText, { color: colors.primary }]}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blob1: {
    width: 250,
    height: 250,
    bottom: -100,
    left: -100,
  },
  blob2: {
    width: 200,
    height: 200,
    bottom: -50,
    right: -100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  heroSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  illustrationContainer: {
    aspectRatio: 1,
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  svgSilhouette: {
    opacity: 0.8,
  },
  locationBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  locationText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  featureGrid: {
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "column",
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  ctaSection: {
    gap: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  boldText: {
    fontWeight: "700",
  },
});
