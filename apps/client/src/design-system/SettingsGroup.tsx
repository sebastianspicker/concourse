/** Groups related settings rows under a light heading and a black rule. */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeProvider";

/** Groups related preference controls under a labeled summary for screen readers. */
export function SettingsGroup({ title, note, children }: { title: string; note?: string; children: React.ReactNode }): JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.group} accessibilityRole="summary">
      <View style={[styles.head, { borderBottomColor: theme.colors.text, borderBottomWidth: theme.ui.borderWidth }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {note ? <Text style={[styles.note, { color: theme.colors.muted }]}>{note}</Text> : null}
      </View>
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {},
  head: { paddingBottom: spacing.sm, gap: 2 },
  title: { ...typography.heading, fontSize: 32, lineHeight: 38 },
  note: { ...typography.small },
});
