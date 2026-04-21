import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { scaled, scaledFont, spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

export function MetaRow({
  label,
  value
}: {
  label: string;
  value: string;
}): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  const captionSize = scaledFont(typography.caption.fontSize, ui);
  const captionLineHeight = scaledFont(typography.caption.lineHeight, ui);
  const bodySize = scaledFont(typography.body.fontSize, ui);
  const bodyLineHeight = scaledFont(typography.body.lineHeight, ui);

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: theme.colors.border,
          borderBottomWidth: ui.borderWidth,
          paddingVertical: scaled(spacing.sm, ui),
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.muted,
            fontSize: captionSize,
            lineHeight: captionLineHeight,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        selectable
        style={[
          styles.value,
          {
            color: theme.colors.text,
            fontSize: bodySize,
            lineHeight: bodyLineHeight,
          },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    fontWeight: "500",
    minWidth: 80,
  },
  value: {
    ...typography.body,
    flex: 1,
    textAlign: "right",
  },
});
