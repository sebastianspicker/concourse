import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { a11yButton } from "@/ui/a11y";
import { borderRadius, scaledFont, scaledRadius, typography, spacing } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import type { ThemePreference } from "@/ui/ThemeContext";

type ThemeOption = { label: string; value: ThemePreference; icon: string };

export const THEME_OPTIONS: ThemeOption[] = [
  { label: "Dark", value: "dark", icon: "🌙" },
  { label: "System", value: "system", icon: "⚙️" },
  { label: "Light", value: "light", icon: "☀️" },
  { label: "Accessible", value: "accessibility", icon: "♿" },
];

const styles = StyleSheet.create({
  themeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  themeIcon: {
    fontSize: 16,
  },
  themeButtonText: {
    ...typography.caption,
    fontWeight: "600",
  },
});

export function ThemeOptionButton({
  option,
  selected,
  onSelect
}: {
  option: ThemeOption;
  selected: boolean;
  onSelect: (value: ThemePreference) => void;
}): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <Pressable
      key={option.value}
      onPress={() => onSelect(option.value)}
      style={[
        styles.themeButton,
        {
          backgroundColor: selected ? theme.colors.accent : theme.colors.surface,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
          borderWidth: selected ? ui.emphasisBorderWidth : ui.borderWidth,
          borderRadius: scaledRadius(borderRadius.lg, ui),
          paddingHorizontal: Math.round(spacing.md * ui.controlScale),
          paddingVertical: Math.round(spacing.sm * ui.controlScale),
        },
      ]}
      {...a11yButton(
        `${option.label} theme`,
        selected ? "Currently selected" : `Select ${option.label.toLowerCase()} theme`
      )}
      accessibilityState={{ selected }}
    >
      <Text style={styles.themeIcon}>{option.icon}</Text>
      <Text
        style={[
          styles.themeButtonText,
          {
            color: selected ? theme.colors.accentText : theme.colors.text,
            fontSize: scaledFont(typography.caption.fontSize, ui),
            lineHeight: scaledFont(typography.caption.lineHeight, ui),
          },
        ]}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}
