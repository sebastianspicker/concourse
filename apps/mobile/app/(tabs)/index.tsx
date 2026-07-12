import React, { useCallback, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { DegradedBanner } from "@/components/DegradedBanner";
import { useSchedule } from "@/hooks/useSchedule";
import { useToday } from "@/hooks/useToday";
import { useLocale } from "@/i18n/LocaleContext";
import { TodayEventsSection } from "@/screens/todayEventsSection";
import { ScheduleSection } from "@/screens/todayScheduleSection";
import { getLocalDayRange, isScheduleUnavailable, sortScheduleItems, type SortDirection } from "@/screens/todayScreenHelpers";
import { Screen } from "@/ui/Screen";
import { StatusBanner } from "@/ui/StatusBanner";
import { spacing, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";

export default function TodayScreen(): JSX.Element {
  const theme = useTheme();
  const { locale } = useLocale();
  const { width } = useWindowDimensions();
  const todayState = useToday();
  const scheduleFilter = getLocalDayRange();
  const scheduleState = useSchedule(scheduleFilter);
  const [scheduleSortDirection, setScheduleSortDirection] = useState<SortDirection>("asc");
  const scheduleUnavailable = isScheduleUnavailable(scheduleState.error);
  const events = todayState.data?.events ?? [];
  const schedule = sortScheduleItems(scheduleState.data?.schedule ?? [], scheduleSortDirection);
  const date = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const refreshAll = useCallback(async () => {
    const requests = [todayState.refresh()];
    if (!scheduleUnavailable) requests.push(scheduleState.refresh());
    await Promise.all(requests);
  }, [scheduleState, scheduleUnavailable, todayState]);

  return (
    <Screen refreshing={todayState.refreshing || scheduleState.refreshing} onRefresh={() => void refreshAll()} maxWidth={1040} testID="today-screen">
      <Text accessibilityRole="header" style={[styles.date, { color: theme.colors.text }]}>{date}</Text>
      {todayState.source === "persisted-cache" ? <StatusBanner kind="cached" cacheAge={todayState.cacheAge} /> : null}
      <DegradedBanner visible={todayState.data?._degraded === true} />
      <View style={[styles.columns, width >= 900 && styles.columnsWide]}>
        <View style={styles.column}>
          <TodayEventsSection loading={todayState.loading} error={todayState.error} events={events} onRetry={() => void refreshAll()} />
        </View>
        {!scheduleUnavailable ? (
          <View style={styles.column}>
            {scheduleState.source === "persisted-cache" ? <StatusBanner kind="cached" cacheAge={scheduleState.cacheAge} /> : null}
            <ScheduleSection
              sortDirection={scheduleSortDirection}
              onToggleSort={() => setScheduleSortDirection((value) => value === "asc" ? "desc" : "asc")}
              loading={scheduleState.loading}
              error={scheduleState.error}
              items={schedule}
              onRetry={() => void refreshAll()}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: { ...typography.heading },
  columns: { gap: spacing.xl },
  columnsWide: { flexDirection: "row", alignItems: "flex-start" },
  column: { flex: 1, minWidth: 0, gap: spacing.md },
});
