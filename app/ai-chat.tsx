import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { apiClient } from "@/services/api";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
}

const QUICK_PROMPTS = [
  "How are my finances this month?",
  "Where am I overspending?",
  "How can I save more?",
  "Am I on track with my saving goal?",
];

export default function AIChatScreen() {
  const { colors } = useTheme();
  useProtectedRoute();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      text: "Hi! I'm your AI financial advisor. I have access to your spending data and can give you personalised advice. What would you like to know?",
      sender: "ai",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Keep conversation history for multi-turn context
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), text, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    historyRef.current.push({ role: "user", content: text });

    try {
      const res = await apiClient.post<any>("/ai/chat", {
        messages: historyRef.current,
      });
      const reply = res.data?.reply ?? "Sorry, I couldn't generate a response.";
      historyRef.current.push({ role: "assistant", content: reply });

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: reply, sender: "ai" },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to reach AI");
    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.row, item.sender === "user" && styles.userRow]}>
      {item.sender === "ai" && (
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <FontAwesome name="star" size={12} color="#fff" />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          item.sender === "ai"
            ? { backgroundColor: colors.card, borderColor: colors.border }
            : { backgroundColor: colors.primary },
        ]}
      >
        <Text style={[styles.bubbleText, { color: item.sender === "ai" ? colors.text : "#fff" }]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={[styles.aiDot, { backgroundColor: colors.primary }]}>
          <FontAwesome name="star" size={14} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>AI Financial Advisor</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Powered by AI · knows your finances
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={[styles.typingRow, { backgroundColor: colors.background }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <FontAwesome name="star" size={12} color="#fff" />
          </View>
          <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        </View>
      )}

      {/* Quick prompts — only show at start */}
      {messages.length === 1 && (
        <View style={styles.quickPrompts}>
          {QUICK_PROMPTS.map((q) => (
            <Pressable
              key={q}
              style={[styles.quickChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => send(q)}
            >
              <Text style={[styles.quickChipText, { color: colors.text }]}>{q}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your finances..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              multiline
              maxLength={500}
              onSubmitEditing={() => send(inputText)}
            />
            <Pressable
              style={[styles.sendBtn, { backgroundColor: inputText.trim() && !isLoading ? colors.primary : colors.border }]}
              onPress={() => send(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              <FontAwesome name="send" size={16} color="#fff" />
            </Pressable>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, gap: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  aiDot: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 15, fontWeight: "700" },
  headerSub: { fontSize: 11, marginTop: 1 },

  messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 8 },
  userRow: { justifyContent: "flex-end" },
  avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  bubble: {
    maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, borderWidth: 1,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },

  typingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  typingBubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, borderWidth: 1 },

  quickPrompts: { paddingHorizontal: 16, paddingBottom: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickChip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  quickChipText: { fontSize: 12, fontWeight: "600" },

  inputRow: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, gap: 10,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, maxHeight: 100,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
});
