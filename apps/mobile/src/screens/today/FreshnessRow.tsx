import { Text, View } from "react-native";
import { useTheme } from "@/ui/ThemeContext";
import { styles } from "./ClockBlock.styles";
import type { TodaySourceTone } from "./todaySourceStatus";

function freshnessSurface(
  tone: TodaySourceTone,
  colors: ReturnType<typeof useTheme>["colors"],
): string {
  if (tone === "success") return colors.successSurface;
  if (tone === "error") return colors.errorSurface;
  if (tone === "warning") return colors.warningSurface;
  return colors.surface;
}

/** Quiet live/freshness chip shown near the clock when chrome is not hosting it. */
export function FreshnessRow({
  label,
  color,
  tone,
}: {
  label: string;
  color: string;
  tone: TodaySourceTone;
}): JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.freshnessRow}>
      <View
        accessibilityLiveRegion="polite"
        style={[
          styles.freshnessChip,
          {
            backgroundColor: freshnessSurface(tone, theme.colors),
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={[styles.freshnessDot, { backgroundColor: color }]} />
        <Text style={[styles.freshnessLabel, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}
