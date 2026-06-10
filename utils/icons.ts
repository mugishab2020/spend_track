/**
 * Maps legacy FontAwesome icon names to MaterialCommunityIcons names.
 * This ensures that existing categories in the database don't cause warnings or broken icons.
 */
export function mapLegacyIcon(iconName: string): string {
  const mapping: Record<string, string> = {
    "cutlery": "silverware",
    "pie-chart": "chart-pie",
    "line-chart": "chart-line",
    "exclamation-triangle": "alert",
    "ban": "cancel",
    "info-circle": "information",
    "check-circle": "check-circle",
    "bullseye": "target",
    "heartbeat": "heart-pulse",
    "shopping-bag": "shopping",
    "film": "movie",
    "graduation-cap": "school",
    "user": "account",
    "plane": "airplane",
    "dollar": "currency-usd",
    "lightbulb-o": "lightbulb-outline",
    "pencil": "pencil",
    "trash": "trash-can",
    "plus": "plus",
    "inbox": "inbox",
    "clock-o": "clock-outline",
    "sliders": "tune",
    "tag": "tag-outline",
    "bus": "bus",
  };

  return mapping[iconName] || iconName;
}
