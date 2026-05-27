import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login, socialLogin, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter both email and password.");
      return;
    }
    try {
      await login({ email: email.trim(), password });
      router.replace("/(tabs)");
    } catch (error: any) {
      let msg = "Login failed. Please try again.";
      if (error?.status === 408) {
        msg = "Connection timed out. Please check your network and try again.";
      } else if (error?.status === 0) {
        msg = "Cannot reach the server. Please check your internet connection.";
      } else if (error?.status === 401) {
        msg = "Invalid email or password.";
      } else if (error?.status >= 500) {
        msg = "Server error. Please try again later.";
      } else if (error?.message) {
        msg = error.message;
      }
      Alert.alert("Login failed", msg);
    }
  };

  // ── Google Login ────────────────────────────────────────────────────────────
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 
    (Platform.OS === "web" ? "dummy-web-client-id.apps.googleusercontent.com" : undefined);

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: webClientId,
  });

  React.useEffect(() => {
    if (googleResponse?.type === "success") {
      const { authentication } = googleResponse;
      handleSocialLogin("google", authentication?.accessToken);
    }
  }, [googleResponse]);

  const handleSocialLogin = async (provider: "google" | "apple", token?: string) => {
    try {
      let socialData: any;

      if (provider === "google" && token) {
        // Fetch user info from Google
        const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await res.json();
        socialData = {
          email: user.email,
          full_name: user.name,
          social_id: user.id,
        };
      } else if (provider === "apple") {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        socialData = {
          email: credential.email!,
          full_name: credential.fullName ? `${credential.fullName.givenName} ${credential.fullName.familyName}` : "Apple User",
          social_id: credential.user,
        };
      }

      if (socialData) {
        await socialLogin(provider, socialData);
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      if (error.code !== "ERR_CANCELED") {
        Alert.alert("Social Login failed", error.message || "Something went wrong.");
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              {/* Header Section */}
              <View style={[styles.header, { backgroundColor: "#C8EDE6" }]}>
                {/* Abstract Blobs */}
                <View style={[styles.blob, styles.blob1, { backgroundColor: "#B5E4DA" }]} />
                <View style={[styles.blob, styles.blob2, { backgroundColor: colors.primary, opacity: 0.1 }]} />
                <View style={[styles.blob, styles.blob3, { backgroundColor: "#D9F4EF" }]} />

                {/* Silhouette & Branding */}
                <View style={styles.branding}>
                  <Svg width="128" height="192" viewBox="0 0 24 24" style={styles.silhouette}>
                    <Path
                      d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 21.5h2.1l1.8-8.2 2.1 2V21.5h2V14.1l-2.1-2 1-4.8c1.3 1.5 3.1 2.5 5.2 2.5V7.8c-1.8 0-3.3-.9-4.2-2.2l-1-1.6c-.4-.7-1.1-1-1.9-1-.3 0-.7.1-1 .2L4.3 5.4V10h2V7.1l2.5-1.1-1 3.9c-.1.5.1 1 .4 1.4L9.8 13.5z"
                      fill={colors.primary}
                    />
                  </Svg>
                  <Text style={[styles.brandName, { color: colors.primary }]}>SpendTrack</Text>
                </View>
              </View>

              {/* Main Content Section */}
              <View style={[styles.content, { backgroundColor: colors.background }]}>
                <View style={styles.formHeader}>
                  <Text style={[styles.title, { color: colors.text }]}>Hello Again!</Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Welcome back, we missed you
                  </Text>
                </View>

                {/* Login Form */}
                <View style={styles.form}>
                  {/* Email Field */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textTertiary }]}>EMAIL ADDRESS</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: "#F0FDF9" }]}>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="john@example.com"
                        placeholderTextColor={colors.border}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!isLoading}
                      />
                      <MaterialIcons name="mail" size={24} color="rgba(0, 104, 89, 0.4)" style={styles.inputIcon} />
                    </View>
                  </View>

                  {/* Password Field */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textTertiary }]}>PASSWORD</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: "#F0FDF9" }]}>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="••••••••"
                        placeholderTextColor={colors.border}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!isLoading}
                      />
                      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.inputIcon}>
                        <MaterialIcons
                          name={showPassword ? "visibility" : "visibility-off"}
                          size={24}
                          color="rgba(0, 104, 89, 0.4)"
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Forgot Password */}
                  <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>FORGOT PASSWORD?</Text>
                  </TouchableOpacity>

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[styles.loginButton, { backgroundColor: "#2F8C7A" }]}
                    onPress={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginButtonText}>Login</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Social Login Divider */}
                <View style={styles.divider}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.border }]}>OR CONTINUE WITH</Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                {/* Social Buttons */}
                <View style={styles.socialButtons}>
                  <TouchableOpacity 
                    style={[styles.socialButton, { borderColor: colors.border }]}
                    onPress={() => {
                      if (Platform.OS === "web" && !process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
                        Alert.alert("Google Login", "Google Social Login is not configured for the Web platform. Please log in using your email and password.");
                      } else {
                        googlePromptAsync();
                      }
                    }}
                    disabled={isLoading}
                  >
                    <Image
                      source={{
                        uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBi7Db1bEin9HZuuqetvru_K5-kBCFoXwRYoqNvni-8SvLzgdZ-uzShnjtrVpYjhWzpfnjs2eVviT1qW6WqpoxEnRn1uYcZsPGYo9PhchzFS0fmBt6_-MbTctTlwZhQqa1mfMgIXK5No9rUHtOioDglRi5AWUG6VcWP5UVOb4yfunKgVTEs73Xjs0j6qNHAOHmCETOCO_Pbh5T7mN9iNq_kFlA4YkR9q_x4duoUIwD87F44e1c9FulbJl05bSp0uRuDBCnJtOQGPxA0",
                      }}
                      style={styles.socialIcon}
                    />
                    <Text style={[styles.socialButtonText, { color: colors.text }]}>GOOGLE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.socialButton, { borderColor: colors.border }]}
                    onPress={() => handleSocialLogin("apple")}
                    disabled={isLoading}
                  >
                    <MaterialIcons name="phone-iphone" size={24} color={colors.text} style={styles.socialIcon} />
                    <Text style={[styles.socialButtonText, { color: colors.text }]}>APPLE</Text>
                  </TouchableOpacity>
                </View>

                {/* Footer Link */}
                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    You don't have an account?{" "}
                    <Text
                      style={[styles.footerLink, { color: colors.primary }]}
                      onPress={() => router.push("/register")}
                    >
                      Register
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 360,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blob1: {
    width: 200,
    height: 200,
    top: -40,
    left: -40,
    opacity: 0.6,
  },
  blob2: {
    width: 250,
    height: 250,
    top: 60,
    right: -60,
  },
  blob3: {
    width: 220,
    height: 220,
    bottom: -60,
    left: "20%",
    opacity: 0.8,
  },
  branding: {
    alignItems: "center",
    zIndex: 10,
  },
  silhouette: {
    marginBottom: 16,
  },
  brandName: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  content: {
    flex: 1,
    marginTop: -40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  formHeader: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    paddingHorizontal: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 24,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  inputIcon: {
    marginLeft: 12,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  loginButton: {
    height: 56,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "rgba(47, 140, 122, 0.4)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  socialButtons: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  socialButtonText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerLink: {
    fontWeight: "700",
  },
});
