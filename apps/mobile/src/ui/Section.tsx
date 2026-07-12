import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }): JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.titleRow}>
      <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">{title}</Text>
      {action}
    </View>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, marginBottom: spacing.md },
  title: { ...typography.subheading },
  body: { gap: spacing.md },
});
