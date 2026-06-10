import { Alert } from "react-native";
import { apiClient } from "@/services/api";
import { API_ENDPOINTS } from "@/constants/api";

export interface PreviewCategory {
  id: string;
  name: string;
  proposed_budget: number;
  current_spent: number;
  percentage_used: number;
  percentage_of_total: number;
  reasoning: string;
  is_locked?: boolean;  // True if budget was manually set
}

export interface DistributionPreview {
  total_income: number;
  total_expenses: number;
  balance: number;
  categories: PreviewCategory[];
}

/**
 * Trigger AI budget distribution with preview and approval workflow
 */
export async function triggerAIBudgetDistribution(onComplete?: () => void) {
  try {
    // Step 1: Get preview from backend
    const previewResponse = await apiClient.get<any>(
      API_ENDPOINTS.AI_DISTRIBUTE_FUNDS_PREVIEW
    );
    
    const preview: DistributionPreview = previewResponse.data;
    
    // Step 2: Show preview to user
    const previewText = preview.categories
      .map(cat => `${cat.name}: ${cat.proposed_budget.toFixed(0)} (${cat.percentage_of_total.toFixed(0)}%)`)
      .join("\n");
    
    const summaryText = `Total Balance: ${preview.balance.toFixed(0)}\n\nProposed Distribution:\n${previewText}`;
    
    Alert.alert(
      "AI Budget Distribution Preview",
      summaryText,
      [
        {
          text: "View Details",
          onPress: () => showDetailedPreview(preview, onComplete),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Approve & Apply",
          onPress: () => applyDistribution(preview, onComplete),
        },
      ]
    );
  } catch (error: any) {
    const errorMsg = error.data?.detail || error.message || "Failed to generate distribution preview";
    Alert.alert("Error", errorMsg);
  }
}

/**
 * Show detailed preview with reasoning
 */
function showDetailedPreview(preview: DistributionPreview, onComplete?: () => void) {
  const lockedCount = preview.categories.filter(c => c.is_locked).length;
  const unlockedCount = preview.categories.filter(c => !c.is_locked).length;
  
  const header = lockedCount > 0 
    ? `${lockedCount} locked (manually set), ${unlockedCount} will be updated:\n\n`
    : "";
  
  const details = preview.categories
    .map(cat => {
      const lockIcon = cat.is_locked ? "🔒 " : "";
      const status = cat.current_spent > cat.proposed_budget 
        ? `⚠️ OVER by ${(cat.current_spent - cat.proposed_budget).toFixed(0)}`
        : cat.percentage_used > 80
        ? `⚠️ ${cat.percentage_used.toFixed(0)}% used`
        : `✓ ${cat.percentage_used.toFixed(0)}% used`;
      
      return `${lockIcon}• ${cat.name}\n  Budget: ${cat.proposed_budget.toFixed(0)}\n  Spent: ${cat.current_spent.toFixed(0)} ${status}\n  ${cat.reasoning}`;
    })
    .join("\n\n");
  
  Alert.alert(
    "Detailed Budget Breakdown",
    header + details,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Approve & Apply",
        onPress: () => applyDistribution(preview, onComplete),
      },
    ],
    { cancelable: true }
  );
}

/**
 * Apply the distribution to database
 */
async function applyDistribution(preview: DistributionPreview, onComplete?: () => void) {
  try {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.AI_DISTRIBUTE_FUNDS_APPLY,
      {}
    );
    
    console.log("✅ Distribution applied successfully:", response.data);
    // Refresh categories immediately so UI reflects the new limits
    if (onComplete) {
      try {
        // If caller returns a Promise, wait for it to finish
        await (onComplete() as Promise<void> | void);
      } catch (e) {
        // If refresh fails, still show success message
        console.warn("Failed to refresh categories after apply:", e);
      }
    }

    Alert.alert(
      "Success!",
      `Budget distributed across ${response.data.categories.length} categories!\n\nTotal Balance: ${response.data.balance.toFixed(0)}`,
      [
        {
          text: "OK",
        },
      ]
    );
  } catch (error: any) {
    const errorMsg = error.data?.detail || error.message || "Failed to apply distribution";
    Alert.alert("Error", errorMsg);
  }
}
