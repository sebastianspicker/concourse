import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { scaledRadius, spacing, typography, withOpacity } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";

const styles = StyleSheet.create({
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statNumber: {
    ...typography.subheading,
    fontWeight: "700",
  },
  statLabel: {
    ...typography.caption,
  },
});

export function StatPill({
  count,
  singular,
  plural,
  color
}: {
  count: number;
  singular: string;
  plural: string;
  color: string;
}): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <View
      style={[
        styles.statPill,
        {
          backgroundColor: withOpacity(color, theme.isDark ? 0.15 : 0.08),
          borderRadius: scaledRadius(12, ui),
        },
      ]}
    >
      <Text style={[styles.statNumber, { color }]}>{count}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.muted }]}>
        {count === 1 ? singular : plural}
      </Text>
    </View>
  );
}
