import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { scaled, scaledFont, scaledRadius, shadows, spacing, typography, withOpacity } from "./theme";
import { useTheme } from "./ThemeContext";

export function Card({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  const cardRadius = scaledRadius(20, ui);
  const cardPadding = scaled(spacing.xl, ui);
  const titleFontSize = scaledFont(typography.body.fontSize, ui);
  const titleLineHeight = scaledFont(typography.body.lineHeight, ui);
  const subtitleFontSize = scaledFont(typography.caption.fontSize, ui);
  const subtitleLineHeight = scaledFont(typography.caption.lineHeight, ui);

  const isDark = theme.isDark;

  return (
    <Animated.View
      entering={FadeIn.duration(500).delay(50)} // Luxurious entrance fade
      style={[
        styles.card,
        isDark ? shadows.md : shadows.sm,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: cardRadius,
          padding: cardPadding,
          shadowColor: isDark ? "#000" : withOpacity(theme.colors.muted, 0.3),
        },
      ]}
    >
      {/* 2026 Glass Edge Overlay - Adds a subtle premium inner highlight */}
      <View
        style={[
          styles.glassEdge,
          {
            borderRadius: cardRadius,
            borderColor: isDark ? theme.colors.border : "rgba(0,0,0,0.03)",
            borderTopColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.9)",
            borderLeftColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)",
            borderWidth: ui.borderWidth,
          }
        ]}
        pointerEvents="none"
      />
      <Text
        selectable
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: titleFontSize,
            lineHeight: titleLineHeight,
          },
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          selectable
          style={[
            styles.subtitle,
            {
              color: theme.colors.muted,
              fontSize: subtitleFontSize,
              lineHeight: subtitleLineHeight,
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderCurve: "continuous",
    position: "relative", // For glass edge constraint
  },
  glassEdge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderCurve: "continuous",
  },
  title: {
    ...typography.body,
    fontWeight: "700", // Polished bold
    letterSpacing: -0.3, // Modern tight tracking
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs, // Tighter coupling to title for visual grouping
    fontWeight: "400",
    letterSpacing: 0.1,
  }
});
