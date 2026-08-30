/** Preserves request-state disclosure and schedule limit copy around the redesigned board. */
import { StyleSheet, Text, View } from "react-native";
import { DegradedBanner } from "@/design-system/DegradedBanner";
import type { useSchedule } from "@/data/public/useSchedule";
import type { useToday } from "@/data/public/useToday";
import { useLocale } from "@/localization/LocaleContext";
import { StatusBanner } from "@/design-system/StatusBanner";
import { spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeContext";

/** Cached and degraded banners for today’s public resources. */
export function TodayStateNotices({
  todayState,
  scheduleState,
}: {
  todayState: ReturnType<typeof useToday>;
  scheduleState: ReturnType<typeof useSchedule>;
}): JSX.Element {
  return (
    <View style={styles.notices}>
      {todayState.source === "persisted-cache" ? (
        <StatusBanner kind="cached" cacheAge={todayState.cacheAge} />
      ) : null}
      {scheduleState.source === "persisted-cache" ? (
        <StatusBanner kind="cached" cacheAge={scheduleState.cacheAge} />
      ) : null}
      <DegradedBanner
        visible={
          todayState.data?._degraded === true || scheduleState.data?._degraded === true
        }
      />
    </View>
  );
}

/** Notes when the schedule list is capped below the full public total. */
export function ScheduleLimitNotice({
  count,
  total,
}: {
  count: number;
  total: number;
}): JSX.Element | null {
  const theme = useTheme();
  const { t } = useLocale();
  if (total <= count) return null;
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[styles.limitNotice, { color: theme.colors.muted }]}
    >
      {t("scheduleLimitNotice", { count, total })}
    </Text>
  );
}

const styles = StyleSheet.create({
  notices: { gap: spacing.sm, paddingTop: spacing.lg },
  limitNotice: { ...typography.caption, paddingTop: spacing.sm },
});
