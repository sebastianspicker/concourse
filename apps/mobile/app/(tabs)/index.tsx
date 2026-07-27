/** Composes the Quiet Chronograph Today view from public-data resources. */
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSetChromeStatus } from "@/components/ChromeStatusContext";
import { getInstitutionTimeZone } from "@/config/institution";
import { useSchedule } from "@/hooks/useSchedule";
import { useToday } from "@/hooks/useToday";
import { useLocale } from "@/i18n/LocaleContext";
import { TodayEventsSection } from "@/screens/todayEventsSection";
import { ScheduleSection } from "@/screens/todayScheduleSection";
import {
  formatCampusTime,
  formatTodayDate,
  getTodayChromeStatus,
  getTodaySourceStatus,
  getTodaySchedule,
  ScheduleLimitNotice,
  SignalStage,
  TodayStateNotices,
} from "@/screens/today";
import {
  getLocalDayRange,
  isScheduleUnavailable,
  type SortDirection,
} from "@/screens/todayScreenHelpers";
import { Screen } from "@/ui/Screen";
import { spacing } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import { useHydratedWindowWidth } from "@/ui/useHydratedWindowWidth";

const WIDE_BREAKPOINT = 900;

/** Composes Today while preserving refresh, sorting, and error behavior. */
export default function TodayScreen(): JSX.Element {
  const theme = useTheme();
  const { locale, t } = useLocale();
  const width = useHydratedWindowWidth();
  const isWide = width >= WIDE_BREAKPOINT;
  const timeZone = getInstitutionTimeZone();
  const todayState = useToday();
  const scheduleState = useSchedule(getLocalDayRange(new Date(), timeZone));
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const setChromeStatus = useSetChromeStatus();
  const scheduleUnavailable = isScheduleUnavailable(scheduleState.error);
  const schedule = getTodaySchedule(scheduleState.data, sortDirection);
  const sourceStatus = getTodaySourceStatus({
    cached: [todayState.source, scheduleState.source].includes("persisted-cache"),
    degraded: [todayState.data?._degraded, scheduleState.data?._degraded, scheduleUnavailable].some(Boolean),
    loading: [todayState.loading, scheduleState.loading].some(Boolean),
    unavailable: todayState.error !== null || (!scheduleUnavailable && scheduleState.error !== null),
    theme,
    t,
    locale,
  });
  const chromeStatus = getTodayChromeStatus(sourceStatus, locale, theme.colors, !isWide);

  // Stack keeps sibling tabs mounted; clear the header chip whenever Today blurs.
  useFocusEffect(
    useCallback(() => {
      setChromeStatus({ label: chromeStatus.label, tone: chromeStatus.tone });
      return () => setChromeStatus(null);
    }, [chromeStatus.label, chromeStatus.tone, setChromeStatus]),
  );

  const refreshAll = useCallback(async () => {
    const requests = [todayState.refresh()];
    if (!scheduleUnavailable) requests.push(scheduleState.refresh());
    await Promise.all(requests);
  }, [scheduleState, scheduleUnavailable, todayState]);

  return (
    <Screen
      refreshing={todayState.refreshing || scheduleState.refreshing}
      onRefresh={() => void refreshAll()}
      maxWidth={1400}
      testID="today-screen"
    >
      <SignalStage
        date={formatTodayDate(locale, timeZone)}
        localTime={formatCampusTime(locale, timeZone)}
        nextItem={schedule.items[0]}
        sourceStatus={sourceStatus}
        locale={locale}
        timeZone={timeZone}
        isWide={isWide}
        showFreshnessChip={false}
      />
      <TodayStateNotices todayState={todayState} scheduleState={scheduleState} />
      <View style={[styles.agenda, isWide && styles.agendaWide]}>
        {!scheduleUnavailable ? (
          <View
            style={[
              styles.agendaColumn,
              isWide && styles.scheduleColumn,
              isWide && { borderRightColor: theme.colors.border },
            ]}
          >
            <ScheduleSection
              sortDirection={sortDirection}
              onToggleSort={() =>
                setSortDirection((value) => (value === "asc" ? "desc" : "asc"))
              }
              loading={scheduleState.loading}
              error={scheduleState.error}
              items={schedule.items}
              source={scheduleState.source}
              isWide={isWide}
              onRetry={() => void scheduleState.refresh()}
            />
            <ScheduleLimitNotice count={schedule.items.length} total={schedule.total} />
          </View>
        ) : null}
        <View style={[styles.agendaColumn, isWide && styles.eventsColumn]}>
          <TodayEventsSection
            loading={todayState.loading}
            error={todayState.error}
            events={todayState.data?.events ?? []}
            source={todayState.source}
            isWide={isWide}
            onRetry={() => void todayState.refresh()}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  agenda: { gap: spacing.xxl },
  agendaWide: { flexDirection: "row", gap: 0 },
  agendaColumn: { flex: 1, minWidth: 0 },
  scheduleColumn: { paddingRight: spacing.xxl, borderRightWidth: StyleSheet.hairlineWidth },
  eventsColumn: { paddingLeft: spacing.xxl },
});
