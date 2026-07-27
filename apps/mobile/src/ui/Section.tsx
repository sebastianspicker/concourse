/** Provides consistent heading and optional action layout for screen subsections. */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "./theme";
import { getDesignPreset } from "./designPresets";
import { useTheme } from "./ThemeContext";

/** Renders an accessible content section with a themed heading and optional action. */
export function SectionHeader({ title, action, prominent = false }: { title: string; action?: React.ReactNode; prominent?: boolean }): JSX.Element {
  const theme = useTheme();
  const metrics = getDesignPreset(theme.designPreset).metrics;
  return (
    <View style={[styles.titleRow, { paddingBottom: metrics.compactGutter - spacing.xs, borderBottomColor: theme.colors.border, borderBottomWidth: theme.ui.borderWidth }]}>
      <Text style={[styles.title, prominent && styles.titleProminent, { color: theme.colors.text }]} accessibilityRole="header">{title}</Text>
      {action ?? null}
    </View>
  );
}

/** Groups a labeled subsection with a consistent header-to-content relationship. */
export function Section({ title, action, children, prominent = false }: { title: string; action?: React.ReactNode; children: React.ReactNode; prominent?: boolean }): JSX.Element {
  const theme = useTheme();
  const metrics = getDesignPreset(theme.designPreset).metrics;
  return (
    <View style={[styles.section, { marginBottom: metrics.sectionGap }]}>
      <SectionHeader title={title} action={action} prominent={prominent} />
      <View
        style={[
          styles.body,
          {
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  title: { ...typography.caption, fontSize: 15, lineHeight: 20, fontWeight: "700", letterSpacing: 0.9, textTransform: "uppercase" },
  titleProminent: { ...typography.heading, fontSize: 28, lineHeight: 34, letterSpacing: -0.7, textTransform: "none" },
  body: { overflow: "hidden" },
});
