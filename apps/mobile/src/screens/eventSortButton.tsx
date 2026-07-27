/** Provides an accessible sort-direction control for event results. */
import { Pressable, StyleSheet, Text } from "react-native";
import type { SortDirection } from "@/screens/eventsScreenHelpers";
import { spacing, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import { useLocale } from "@/i18n/LocaleContext";

const styles = StyleSheet.create({
  sortButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  sortText: {
    ...typography.caption,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.7,
  },
});

/** Toggles chronological order with an accessible label that describes the next sort action. */
export function EventSortButton({
  sortDirection,
  onToggleSort
}: {
  sortDirection: SortDirection;
  onToggleSort: () => void;
}): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const direction = sortDirection === "asc" ? t("sortDescending") : t("sortAscending");

  return (
    <Pressable
      onPress={onToggleSort}
      style={({ pressed }) => [
        styles.sortButton,
        {
          borderColor: theme.colors.border,
          borderWidth: theme.ui.borderWidth,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={t("sortEventsAccessibility", { direction })}
    >
      <Text style={[styles.sortText, { color: theme.colors.text }]}>
        {sortDirection === "asc" ? t("sortEventsAscending") : t("sortEventsDescending")}
      </Text>
    </Pressable>
  );
}
