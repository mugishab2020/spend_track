import React, { useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { TRANSACTION_CATEGORIES } from "@/utils/categories";
import { useTheme } from "@/context/ThemeContext";

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");

  // Transaction modal state
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    // Here you would typically save to a database or context
    // For now, we'll just show a success message
    Alert.alert("Success", `Category "${newCategoryName}" added!`, [
      {
        text: "OK",
        onPress: () => {
          setNewCategoryName("");
          setNewCategoryIcon("");
          setAddCategoryModalVisible(false);
        },
      },
    ]);
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    setTransactionModalVisible(true);
  };

  const handleAddTransaction = () => {
    if (!transactionAmount.trim()) {
      Alert.alert("Error", "Amount is required");
      return;
    }

    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    // Here you would typically save to a database or context
    // For now, we'll just show a success message
    Alert.alert(
      "Success",
      `Expense of $${amount.toFixed(2)} added to ${selectedCategory}!`,
      [
        {
          text: "OK",
          onPress: () => {
            setTransactionAmount("");
            setTransactionDescription("");
            setSelectedCategory("");
            setTransactionModalVisible(false);
          },
        },
      ],
    );
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, string> = {
      Salary: "dollar",
      Freelance: "briefcase",
      Investments: "line-chart",
      Food: "cutlery",
      Transport: "car",
      Shopping: "shopping-bag",
      Bills: "home",
      Health: "heartbeat",
      Entertainment: "film",
      Other: "tag",
    };
    return iconMap[category] || "tag";
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#84CC16",
      "#F97316",
      "#6366F1",
    ];
    return colors[index % colors.length];
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Categories</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage your transaction categories
          </Text>
        </View>

        <View style={styles.categoriesGrid}>
          {TRANSACTION_CATEGORIES.map((category, index) => (
            <Pressable
              key={category}
              style={[styles.categoryCard, { backgroundColor: colors.card }]}
              onPress={() => handleCategoryPress(category)}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: getCategoryColor(index) },
                ]}
              >
                <FontAwesome
                  name={getCategoryIcon(category) as any}
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <Text style={[styles.categoryName, { color: colors.text }]}>
                {category}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setAddCategoryModalVisible(true)}
        >
          <FontAwesome name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add New Category</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={addCategoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddCategoryModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContentContainer}>
              <View
                style={[styles.modalContent, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Add New Category
                </Text>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Category Name
                  </Text>
                  <TextInput
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="e.g. Travel, Education"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Icon (optional)
                  </Text>
                  <TextInput
                    value={newCategoryIcon}
                    onChangeText={setNewCategoryIcon}
                    placeholder="e.g. plane, book"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                </View>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={[
                      styles.modalButton,
                      styles.cancelButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setAddCategoryModalVisible(false)}
                  >
                    <Text
                      style={[styles.cancelButtonText, { color: colors.text }]}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modalButton,
                      styles.confirmButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={handleAddCategory}
                  >
                    <Text style={styles.confirmButtonText}>Add Category</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={transactionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTransactionModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContentContainer}>
              <View
                style={[styles.modalContent, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Add Expense
                </Text>

                <View style={styles.categoryDisplay}>
                  <Text
                    style={[
                      styles.categoryDisplayLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Category
                  </Text>
                  <View
                    style={[
                      styles.categoryDisplayCard,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryDisplayIcon,
                        {
                          backgroundColor: getCategoryColor(
                            TRANSACTION_CATEGORIES.indexOf(selectedCategory),
                          ),
                        },
                      ]}
                    >
                      <FontAwesome
                        name={getCategoryIcon(selectedCategory) as any}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryDisplayText,
                        { color: colors.text },
                      ]}
                    >
                      {selectedCategory}
                    </Text>
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Amount
                  </Text>
                  <TextInput
                    value={transactionAmount}
                    onChangeText={setTransactionAmount}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Description (optional)
                  </Text>
                  <TextInput
                    value={transactionDescription}
                    onChangeText={setTransactionDescription}
                    placeholder="e.g. Lunch at restaurant"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={[
                      styles.modalButton,
                      styles.cancelButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setTransactionModalVisible(false)}
                  >
                    <Text
                      style={[styles.cancelButtonText, { color: colors.text }]}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modalButton,
                      styles.confirmButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={handleAddTransaction}
                  >
                    <Text style={styles.confirmButtonText}>Add Expense</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  categoryCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContentContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  categoryDisplay: {
    marginBottom: 20,
  },
  categoryDisplayLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  categoryDisplayCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  categoryDisplayIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryDisplayText: {
    fontSize: 16,
    fontWeight: "600",
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // backgroundColor is set dynamically
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
