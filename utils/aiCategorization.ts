import { Alert } from "react-native";
import { aiCategorizationService } from "@/services/aiCategorization.service";

/**
 * Trigger AI bulk categorization with user confirmation
 */
export async function triggerAICategorization(onComplete?: () => void) {
  Alert.alert(
    "AI Categorization",
    "Let AI automatically categorize your uncategorized transactions?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Categorize",
        onPress: async () => {
          try {
            const result = await aiCategorizationService.categorizeBulk();
            
            if (result.categorized_count === 0) {
              Alert.alert(
                "All Set!",
                "All your transactions are already categorized."
              );
            } else {
              Alert.alert(
                "Success!",
                `AI categorized ${result.categorized_count} transactions. Review them in your transaction history.`,
                [
                  {
                    text: "OK",
                    onPress: onComplete,
                  },
                ]
              );
            }
          } catch (error: any) {
            Alert.alert(
              "Error",
              error.message || "Failed to categorize transactions. Please try again."
            );
          }
        },
      },
    ]
  );
}

/**
 * Categorize a single transaction with AI
 */
export async function categorizeSingleTransaction(
  transactionId: string,
  onComplete?: (categoryId: string, categoryName: string) => void
) {
  try {
    const result = await aiCategorizationService.categorizeTransaction(transactionId);
    
    Alert.alert(
      "AI Suggestion",
      `AI suggests: ${result.suggested_category_name}\n\nConfidence: ${result.confidence}%\n\nReason: ${result.reasoning}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Apply",
          onPress: () => {
            if (onComplete) {
              onComplete(result.suggested_category_id, result.suggested_category_name);
            }
          },
        },
      ]
    );
  } catch (error: any) {
    Alert.alert(
      "Error",
      error.message || "Failed to get AI suggestion. Please try again."
    );
  }
}
