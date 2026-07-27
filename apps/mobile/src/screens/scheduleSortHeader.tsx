/** Provides an accessible schedule sort control with localized direction feedback. */
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SortDirection } from "@/screens/todayScreenHelpers";
import { spacing, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import { useLocale } from "@/i18n/LocaleContext";

const styles = StyleSheet.create({
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  sortButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  sortButtonInline: {
    minHeight: 44,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
  },
  sortText: {
    ...typography.caption,
    fontWeight: "600",
  },
  sortTextInline: {
    textDecorationLine: "underline",
  },
  pressed: {
    opacity: 0.7,
  },
});

/** Renders the schedule heading and an accessible control for direction changes. */
export function ScheduleSortHeader({
  sortDirection,
  onToggleSort,
  inline = false,
}: {
  sortDirection: SortDirection;
  onToggleSort: () => void;
  inline?: boolean;
}): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const direction = sortDirection === "asc" ? t("sortDescending") : t("sortAscending");
  const getSortButtonStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => [
      styles.sortButton,
      {
        borderColor: theme.colors.border,
        borderWidth: theme.ui.borderWidth,
      },
      pressed && styles.pressed,
    ],
    [theme.colors.border, theme.ui.borderWidth]
  );

  return (
    <View style={styles.scheduleHeader}>
      <Pressable
        onPress={onToggleSort}
        style={inline ? ({ pressed }) => [styles.sortButtonInline, pressed && styles.pressed] : getSortButtonStyle}
        accessibilityRole="button"
        accessibilityLabel={t("sortScheduleAccessibility", { direction })}
      >
        <Text style={[styles.sortText, inline && styles.sortTextInline, { color: inline ? theme.colors.accent : theme.colors.text }]}>
          {sortDirection === "asc" ? t("sortScheduleAscending") : t("sortScheduleDescending")}
        </Text>
      </Pressable>
    </View>
  );
}
