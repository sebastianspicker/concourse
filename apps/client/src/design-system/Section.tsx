/** Sections: a light heading with a quiet count and an optional action; rows and cards bring their own rules. */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "./theme";
import { useTheme, useDesignMetrics } from "./ThemeProvider";

/** Renders an accessible section heading over an ink hairline, like the head of a printed catalogue. */
export function SectionHeader({ title, meta, action }: { title: string; meta?: string; action?: React.ReactNode }): JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleGroup}>
        <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">{title}</Text>
        {meta ? <Text style={[styles.meta, { color: theme.colors.muted }]}>{meta}</Text> : null}
      </View>
      {action ?? null}
    </View>
  );
}

/** Groups a labeled subsection with a consistent header-to-content relationship. */
export function Section({ title, meta, action, children }: { title: string; meta?: string; action?: React.ReactNode; children: React.ReactNode }): JSX.Element {
  const metrics = useDesignMetrics();
  return (
    <View style={{ marginBottom: metrics.sectionGap }}>
      <SectionHeader title={title} meta={meta} action={action} />
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.lg,
    minHeight: 56,
  },
  titleGroup: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: spacing.md, rowGap: 2, flexShrink: 1, paddingBottom: spacing.xs },
  title: { ...typography.heading },
  meta: { ...typography.caption },
});
