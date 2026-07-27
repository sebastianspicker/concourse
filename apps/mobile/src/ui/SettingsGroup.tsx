/** Groups related settings rows with accessible section labels and spacing. */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

export { ChoiceRow } from "./ChoiceRow";

/** Groups related preference controls under a labeled summary for screen readers. */
export function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.group} accessibilityRole="summary">
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <View
        style={[
          styles.rows,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderTopWidth: theme.ui.borderWidth,
            borderBottomWidth: theme.ui.borderWidth,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.lg },
  title: { ...typography.caption, fontSize: 15, lineHeight: 20, fontWeight: "700", letterSpacing: 0.9, textTransform: "uppercase" },
  rows: { overflow: "hidden" },
});
