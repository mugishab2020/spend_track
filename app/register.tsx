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

const COUNTRY_CODES = ["+250", "+1", "+44", "+33", "+49", "+254", "+255"];

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { register, socialLogin, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+250");
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Missing fields", "Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    if (username.length < 3) {
      Alert.alert("Invalid username", "Username must be at least 3 characters.");
      return;
    }

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        phone_number: `${countryCode}${phone.trim()}`,
      });
      router.replace("/(tabs)");
    } catch (error: any) {
      let msg = "Could not create account. Please try again.";
      if (error.status === 408) msg = "Connection timeout.";
      else if (error.status === 0) msg = "Backend unreachable.";
      else if (error.status === 400) {
        if (error.data?.detail?.includes("Email")) msg = "Email already registered.";
        else if (error.data?.detail?.includes("Username")) msg = "Username already taken.";
        else msg = error.data?.detail || msg;
      }
      else if (error.message) msg = error.message;
      Alert.alert("Registration failed", msg);
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
                  <Svg width="100" height="150" viewBox="0 0 24 24" style={styles.silhouette}>
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
                  <Text style={[styles.title, { color: colors.text }]}>
                    Let us get you Started!
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Join others to track and grow your finances
                  </Text>
                </View>

                {/* Registration Form */}
                <View style={styles.form}>
                  {/* Username */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textTertiary }]}>USERNAME</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: "#F0FDF9" }]}>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="johndoe"
                        placeholderTextColor={colors.border}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        editable={!isLoading}
                      />
                      <MaterialIcons name="person" size={24} color="rgba(0, 104, 89, 0.4)" style={styles.inputIcon} />
                    </View>
                  </View>

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

                  {/* Phone Field */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textTertiary }]}>PHONE NUMBER</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: "#F0FDF9" }]}>
                      <Pressable
                        style={styles.countryPicker}
                        onPress={() => setShowCodePicker(!showCodePicker)}
                      >
                        <Text style={[styles.countryCode, { color: colors.text }]}>{countryCode}</Text>
                        <MaterialIcons name="arrow-drop-down" size={20} color={colors.textSecondary} />
                      </Pressable>
                      <View style={[styles.dividerVertical, { backgroundColor: colors.borderLight }]} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="788 000 000"
                        placeholderTextColor={colors.border}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        editable={!isLoading}
                      />
                    </View>
                  </View>

                  {/* Country code picker dropdown */}
                  {showCodePicker && (
                    <View style={[styles.pickerDropdown, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                      {COUNTRY_CODES.map((code) => (
                        <TouchableOpacity
                          key={code}
                          style={styles.pickerItem}
                          onPress={() => {
                            setCountryCode(code);
                            setShowCodePicker(false);
                          }}
                        >
                          <Text style={[styles.pickerText, { color: colors.text }]}>{code}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

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

                  {/* Confirm Password Field */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textTertiary }]}>CONFIRM PASSWORD</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: "#F0FDF9" }]}>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="••••••••"
                        placeholderTextColor={colors.border}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirm}
                        editable={!isLoading}
                      />
                      <Pressable onPress={() => setShowConfirm(!showConfirm)} style={styles.inputIcon}>
                        <MaterialIcons
                          name={showConfirm ? "visibility" : "visibility-off"}
                          size={24}
                          color="rgba(0, 104, 89, 0.4)"
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Register Button */}
                  <TouchableOpacity
                    style={[styles.registerButton, { backgroundColor: "#2F8C7A" }]}
                    onPress={handleRegister}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.registerButtonText}>Create Account</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Footer Link */}
                <>
                  {/* Social Login Divider */}
                  <View style={styles.divider}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.dividerText, { color: colors.border }]}>OR JOIN WITH</Text>
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

                  <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                      Already have an account?{" "}
                      <Text
                        style={[styles.footerLink, { color: colors.primary }]}
                        onPress={() => router.push("/login")}
                      >
                        Login
                      </Text>
                    </Text>
                  </View>
                </>
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
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blob1: {
    width: 180,
    height: 180,
    top: -40,
    left: -40,
    opacity: 0.6,
  },
  blob2: {
    width: 220,
    height: 220,
    top: 40,
    right: -50,
  },
  blob3: {
    width: 200,
    height: 200,
    bottom: -50,
    left: "15%",
    opacity: 0.8,
  },
  branding: {
    alignItems: "center",
    zIndex: 10,
  },
  silhouette: {
    marginBottom: 12,
  },
  brandName: {
    fontSize: 28,
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
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    paddingHorizontal: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 24,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  inputIcon: {
    marginLeft: 12,
  },
  countryPicker: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: "700",
  },
  dividerVertical: {
    width: 1,
    height: 24,
    marginRight: 16,
  },
  pickerDropdown: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
    padding: 8,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 15,
    fontWeight: "600",
  },
  registerButton: {
    height: 54,
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
  registerButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerLink: {
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  socialButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialButtonText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  currencyChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  currencyChipText: {
    fontSize: 14,
    fontWeight: "700",
  },
  hintText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2F8C7A",
    paddingHorizontal: 12,
    marginTop: 4,
  },
  backBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
