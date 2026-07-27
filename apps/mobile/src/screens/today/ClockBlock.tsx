/** Quiet Chronograph date line, clock face, and optional campus-time meta. */
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import { ClockFace } from "./ClockFace";
import type { TodaySourceTone } from "./todaySourceStatus";

/** Quiet live/freshness chip shown near the clock when chrome is not hosting it. */
function FreshnessChip({
  label,
  color,
  surface,
  border,
}: {
  label: string;
  color: string;
  surface: string;
  border: string;
}): JSX.Element {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.freshnessChip, { backgroundColor: surface, borderColor: border }]}
    >
      <View style={[styles.freshnessDot, { backgroundColor: color }]} />
      <Text style={[styles.freshnessLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function freshnessSurface(
  tone: TodaySourceTone,
  colors: ReturnType<typeof useTheme>["colors"],
): string {
  if (tone === "success") return colors.successSurface;
  if (tone === "error") return colors.errorSurface;
  if (tone === "warning") return colors.warningSurface;
  return colors.surface;
}

/** Date + large tabular clock + optional meta/freshness. */
export function ClockBlock({
  date,
  localTime,
  isWide,
  timeZone,
  campusLocalLabel,
  showFreshnessChip,
  chromeLabel,
  chromeColor,
  chromeTone,
}: {
  date: string;
  localTime: string;
  isWide: boolean;
  timeZone: string;
  campusLocalLabel: string;
  showFreshnessChip: boolean;
  chromeLabel: string;
  chromeColor: string;
  chromeTone: TodaySourceTone;
}): JSX.Element {
  const theme = useTheme();
  return (
    <View
      testID="today-clock-block"
      style={[
        styles.clockBlock,
        isWide && styles.clockBlockWide,
        { borderColor: theme.colors.border },
      ]}
    >
      <Text accessibilityRole="header" style={[styles.date, { color: theme.colors.muted }]}>
        {date}
      </Text>
      <ClockFace
        localTime={localTime}
        textColor={theme.colors.text}
        colonColor={theme.colors.signal}
      />
      {isWide ? (
        <View style={styles.clockMeta}>
          <Text style={[styles.clockMetaLabel, { color: theme.colors.muted }]}>
            {campusLocalLabel}
          </Text>
          <View
            style={[
              styles.tzChip,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
            ]}
          >
            <Text style={[styles.tzChipText, { color: theme.colors.muted }]}>{timeZone}</Text>
          </View>
        </View>
      ) : null}
      {showFreshnessChip ? (
        <View style={styles.freshnessRow}>
          <FreshnessChip
            label={chromeLabel}
            color={chromeColor}
            surface={freshnessSurface(chromeTone, theme.colors)}
            border={theme.colors.border}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clockBlock: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.lg,
    minHeight: 100,
    justifyContent: "flex-end",
  },
  clockBlockWide: {
    width: 330,
    minHeight: 168,
    borderBottomWidth: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingRight: spacing.xxl,
    paddingBottom: spacing.sm,
    justifyContent: "flex-end",
  },
  date: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    letterSpacing: -0.15,
    marginBottom: spacing.sm,
  },
  clockMeta: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  clockMetaLabel: {
    ...typography.caption,
    fontWeight: "500",
  },
  tzChip: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tzChipText: {
    ...typography.small,
    fontWeight: "500",
  },
  freshnessRow: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  freshnessChip: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
  },
  freshnessDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  freshnessLabel: {
    ...typography.caption,
    fontWeight: "500",
  },
});
