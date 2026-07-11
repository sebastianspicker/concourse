import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { scaled, scaledFont, scaledRadius, spacing, typography, withOpacity } from "./theme";
import { useTheme } from "./ThemeContext";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.body,
    fontWeight: "500",
    textAlign: "center",
  },
  hint: {
    ...typography.caption,
    textAlign: "center",
    maxWidth: 260,
  },
});

export type EmptyStateProps = {
  message: string;
  icon?: string;
  /** Optional hint shown below the message in smaller text */
  hint?: string;
};

export function EmptyState({ message, icon, hint }: EmptyStateProps): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;
  const iconSize = scaled(40, ui);
  const iconContainerSize = scaled(72, ui);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: withOpacity(theme.colors.muted, theme.isDark ? 0.06 : 0.04),
          borderRadius: scaledRadius(16, ui),
          padding: scaled(spacing.xl, ui),
        },
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.iconCircle,
            {
              width: iconContainerSize,
              height: iconContainerSize,
              borderRadius: iconContainerSize / 2,
              backgroundColor: withOpacity(theme.colors.muted, theme.isDark ? 0.08 : 0.06),
            },
          ]}
        >
          <Text style={{ fontSize: iconSize }}>{icon}</Text>
        </View>
      ) : null}
      <Text
        selectable
        accessibilityRole="text"
        style={[
          styles.message,
          {
            color: theme.colors.text,
            fontSize: scaledFont(typography.body.fontSize, ui),
            lineHeight: scaledFont(typography.body.lineHeight, ui),
          },
        ]}
      >
        {message}
      </Text>
      {hint ? (
        <Text
          style={[
            styles.hint,
            {
              color: theme.colors.muted,
              fontSize: scaledFont(typography.caption.fontSize, ui),
              lineHeight: scaledFont(typography.caption.lineHeight, ui),
            },
          ]}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
