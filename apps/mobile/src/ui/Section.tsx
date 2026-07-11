import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { scaled, scaledFont, spacing, typography, withOpacity } from "./theme";
import { useTheme } from "./ThemeContext";

const styles = StyleSheet.create({
  section: {},
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  titleAccent: {
    height: 14,
  },
  title: {
    ...typography.small,
  },
  body: {
    gap: spacing.md,
  },
});

export function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <View style={[styles.section, { marginBottom: scaled(spacing.xl, ui) }]}>
      <View style={styles.titleRow}>
        <View
          style={[
            styles.titleAccent,
            {
              backgroundColor: withOpacity(theme.colors.accent, 0.5),
              width: 3,
              borderRadius: 2,
            },
          ]}
        />
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.muted,
              fontSize: scaledFont(typography.small.fontSize, ui),
              letterSpacing: typography.small.letterSpacing + 0.5,
              textTransform: "uppercase",
              fontWeight: "700",
            },
          ]}
          accessibilityRole="header"
        >
          {title}
        </Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}
