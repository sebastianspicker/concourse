import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { scaledRadius, spacing, typography } from "../ui/theme";
import { useTheme } from "../ui/ThemeContext";

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;
  /** Called immediately when user types (before debounce) */
  onImmediateChange?: (text: string) => void;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  debounceMs = 300,
  onImmediateChange
}: SearchBarProps): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChangeText = useCallback((text: string) => {
    setLocalValue(text);

    // Call immediate change callback if provided
    onImmediateChange?.(text);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounced timer
    debounceTimerRef.current = setTimeout(() => {
      onChangeText(text);
    }, debounceMs);
  }, [onChangeText, debounceMs, onImmediateChange]);

  const controlPaddingX = Math.round(spacing.md * ui.controlScale);
  const controlPaddingY = Math.round(spacing.sm * ui.controlScale);
  const controlRadius = scaledRadius(12, ui);
  const inputFontSize = Math.round(typography.body.fontSize * ui.fontScale);
  const inputLineHeight = Math.round(typography.body.lineHeight * ui.fontScale);

  return (
    <View
      style={[
        styles.inputContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: ui.borderWidth,
          borderRadius: controlRadius,
          paddingHorizontal: controlPaddingX,
          paddingVertical: controlPaddingY,
        },
      ]}
      accessibilityRole="search"
    >
      <Text style={[styles.searchIcon, { color: theme.colors.placeholder }]}>
        🔍
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.text,
            fontSize: inputFontSize,
            lineHeight: inputLineHeight,
          },
        ]}
        value={localValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    ...typography.body,
  },
});
