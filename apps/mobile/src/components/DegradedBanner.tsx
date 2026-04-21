import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography, withOpacity } from "../ui/theme";
import { useTheme } from "../ui/ThemeContext";

type Props = {
  visible: boolean;
  message?: string;
};

/**
 * A subtle banner shown when the BFF returned `_degraded: true`, indicating
 * that some upstream sources failed and the data may be incomplete.
 * Helps students understand why certain events might be missing.
 */
export function DegradedBanner({
  visible,
  message = "Some data sources are temporarily unavailable. Information may be incomplete.",
}: Props): JSX.Element | null {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: withOpacity(theme.colors.warning, theme.isDark ? 0.15 : 0.1),
          borderColor: withOpacity(theme.colors.warning, 0.3),
        },
      ]}
      accessibilityRole="alert"
    >
      <Text style={styles.icon}>⚠️</Text>
      <Text
        style={[
          styles.text,
          { color: theme.isDark ? theme.colors.warning : "#92400e" },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    ...typography.caption,
    flex: 1,
  },
});
