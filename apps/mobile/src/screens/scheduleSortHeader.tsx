import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SortDirection } from "@/screens/todayScreenHelpers";
import { scaledRadius, spacing, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";

const styles = StyleSheet.create({
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  sortButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sortText: {
    ...typography.caption,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});

export function ScheduleSortHeader({
  sortDirection,
  onToggleSort
}: {
  sortDirection: SortDirection;
  onToggleSort: () => void;
}): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;
  const getSortButtonStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => [
      styles.sortButton,
      {
        borderColor: theme.colors.border,
        borderWidth: theme.ui.borderWidth,
        borderRadius: scaledRadius(8, ui),
      },
      pressed && styles.pressed,
    ],
    [theme.colors.border, theme.ui.borderWidth, ui]
  );

  return (
    <View style={styles.scheduleHeader}>
      <Pressable
        onPress={onToggleSort}
        style={getSortButtonStyle}
        accessibilityRole="button"
        accessibilityLabel={`Sort schedule ${sortDirection === "asc" ? "latest first" : "earliest first"}`}
      >
        <Text style={[styles.sortText, { color: theme.colors.text }]}>
          {sortDirection === "asc" ? "↑ Earliest first" : "↓ Latest first"}
        </Text>
      </Pressable>
    </View>
  );
}
