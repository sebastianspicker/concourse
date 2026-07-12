import { Platform } from "react-native";
import type { EdgeInsets } from "react-native-safe-area-context";
import type { useTheme } from "@/ui/ThemeContext";

type Theme = ReturnType<typeof useTheme>;

export function getTabBarOptions(theme: Theme, insets: EdgeInsets): object {
  return {
    tabBarStyle: {
      backgroundColor: theme.colors.background,
      borderTopColor: theme.colors.border,
      borderTopWidth: theme.ui.borderWidth,
      paddingBottom: Platform.OS === "ios" ? insets.bottom : 8,
      paddingTop: 6,
      height: Platform.OS === "ios" ? 52 + insets.bottom : 60,
    },
    tabBarActiveTintColor: theme.colors.accent,
    tabBarInactiveTintColor: theme.colors.muted,
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.1,
      marginTop: 2,
    },
  };
}
