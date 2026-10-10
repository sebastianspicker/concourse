/** Provides an accessible sort-direction toggle shared by list and schedule screens. */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text } from "react-native";
import type { TranslationKey } from "@/localization/dictionaries";
import { useLocale } from "@/localization/LocaleContext";
import { spacing, typography } from "./theme";
import { useTheme, useDesignMetrics } from "./ThemeProvider";

export type SortDirection = "asc" | "desc";

export type SortButtonVariant = "control" | "inline";

type SortButtonProps = {
  sortDirection: SortDirection;
  onToggleSort: () => void;
  /** Visible labels for the current direction. */
  labelKeys: Record<SortDirection, TranslationKey>;
  /** Accessibility template receiving the direction the next press selects. */
  accessibilityKey: TranslationKey;
  variant?: SortButtonVariant;
};

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  inline: { paddingHorizontal: spacing.xs },
  text: { ...typography.action, fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.64 },
});

/** Toggles chronological order with an accessible label that describes the next sort action. */
export function SortButton({
  sortDirection,
  onToggleSort,
  labelKeys,
  accessibilityKey,
  variant = "control",
}: SortButtonProps): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const metrics = useDesignMetrics();
  const direction = sortDirection === "asc" ? t("sortDescending") : t("sortAscending");
  const outline = variant === "control"
    ? { borderColor: theme.colors.controlBorder, borderWidth: theme.ui.borderWidth, borderRadius: metrics.controlRadius }
    : null;

  return (
    <Pressable
      onPress={onToggleSort}
      style={({ pressed }) => [styles.button, variant === "inline" && styles.inline, outline, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={t(accessibilityKey, { direction })}
    >
      <MaterialIcons name={sortDirection === "asc" ? "arrow-upward" : "arrow-downward"} size={16} color={theme.colors.text} />
      <Text style={[styles.text, { color: theme.colors.text }]}>{t(labelKeys[sortDirection])}</Text>
    </Pressable>
  );
}
