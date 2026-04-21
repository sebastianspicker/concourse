import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../ui/theme";
import { useTheme } from "../ui/ThemeContext";

export type FilterOption = {
  id: string;
  label: string;
};

export type FilterPanelProps = {
  title?: string;
  options: FilterOption[];
  selectedId?: string;
  onSelect: (optionId: string) => void;
  /** Tapping the active option deselects it when true (default). */
  allowClear?: boolean;
  loading?: boolean;
};

export function FilterPanel({
  title,
  options,
  selectedId,
  onSelect,
  allowClear = true,
  loading = false
}: FilterPanelProps): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  const handlePress = useCallback((optionId: string) => {
    if (loading) return;
    
    if (allowClear && optionId === selectedId) {
      onSelect(""); // Clear selection
    } else {
      onSelect(optionId);
    }
  }, [selectedId, onSelect, allowClear, loading]);

  if (options.length === 0) {
    return <View />;
  }

  const controlPaddingX = Math.round(spacing.md * ui.controlScale);
  const controlPaddingY = Math.round(spacing.sm * ui.controlScale);
  const controlRadius = Math.round(16 * ui.borderRadiusScale);
  const titleFontSize = Math.round(typography.caption.fontSize * ui.fontScale);
  const titleLineHeight = Math.round(typography.caption.lineHeight * ui.fontScale);
  const optionFontSize = Math.round(14 * ui.fontScale);
  const optionLineHeight = Math.round(typography.body.lineHeight * ui.fontScale);

  return (
    <View style={[styles.container, { paddingHorizontal: controlPaddingX, paddingVertical: controlPaddingY }] }>
      {title ? (
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.muted,
              fontSize: titleFontSize,
              lineHeight: titleLineHeight,
            },
          ]}
        >
          {title}
        </Text>
      ) : null}
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = option.id === selectedId;
          return (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.option,
                {
                  borderRadius: controlRadius,
                  borderWidth: isSelected ? ui.emphasisBorderWidth : ui.borderWidth,
                  backgroundColor: isSelected ? theme.colors.accent : theme.colors.surface,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                  paddingHorizontal: controlPaddingX,
                  paddingVertical: controlPaddingY,
                },
                pressed && styles.optionPressed,
                loading && styles.optionDisabled
              ]}
              onPress={() => handlePress(option.id)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: isSelected ? theme.colors.accentText : theme.colors.text,
                    fontSize: optionFontSize,
                    lineHeight: optionLineHeight,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  title: {
    ...typography.caption,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  option: {
  },
  optionPressed: {
    opacity: 0.7
  },
  optionDisabled: {
    opacity: 0.5
  },
  optionText: {
    ...typography.body,
    fontSize: 14
  }
});
