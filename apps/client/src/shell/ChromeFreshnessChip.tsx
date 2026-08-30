import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeContext";
import { useChromeStatus, type ChromeStatusTone } from "./ChromeStatusContext";

function toneColors(
  tone: ChromeStatusTone,
  colors: ReturnType<typeof useTheme>["colors"],
): { text: string; background: string; dot: string } {
  switch (tone) {
    case "warning":
      return { text: colors.warning, background: colors.warningSurface, dot: colors.warning };
    case "error":
      return { text: colors.error, background: colors.errorSurface, dot: colors.error };
    case "muted":
      return { text: colors.muted, background: colors.background, dot: colors.muted };
    case "success":
    default:
      return { text: colors.success, background: colors.successSurface, dot: colors.success };
  }
}

export function ChromeFreshnessChip(): JSX.Element | null {
  const theme = useTheme();
  const status = useChromeStatus();
  if (status === null) return null;

  const palette = toneColors(status.tone, theme.colors);

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      style={[
        styles.chip,
        {
          backgroundColor: palette.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.dot, { backgroundColor: palette.dot }]}
      />
      <Text numberOfLines={1} style={[styles.label, { color: palette.text }]}>
        {status.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    maxWidth: 220,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    ...typography.caption,
    fontWeight: "500",
    flexShrink: 1,
  },
});
