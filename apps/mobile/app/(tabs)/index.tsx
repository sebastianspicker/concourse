/** Composes the Quiet Chronograph Today view from public-data resources. */
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSetChromeStatus } from "@/components/ChromeStatusContext";
import { getInstitutionTimeZone } from "@/config/institution";
import { useSchedule } from "@/hooks/useSchedule";
import { useToday } from "@/hooks/useToday";
import { useLocale } from "@/i18n/LocaleContext";
import {
  formatCampusTime,
  formatTodayDate,
  getTodayChromeStatus,
  getTodaySourceStatus,
  getTodaySchedule,
  SignalStage,
  TodayStateNotices,
} from "@/screens/today";
import { TodayAgenda } from "@/screens/today/TodayAgenda";
import type { TodayChromeStatus } from "@/screens/today/todaySourceStatus";
import {
  getLocalDayRange,
  isScheduleUnavailable,
  type SortDirection,
} from "@/screens/todayScreenHelpers";
import { Screen } from "@/ui/Screen";
import { useTheme } from "@/ui/ThemeContext";
import { useHydratedWindowWidth } from "@/ui/useHydratedWindowWidth";
import { isStaticDemo } from "@/config/staticDemo";

const WIDE_BREAKPOINT = 900;

/** Prevents static clock markup from becoming stale before the demo hydrates. */
function useDemoSafeCampusClock(locale: string, timeZone: string, loadingLabel: string) {
  const staticDemo = isStaticDemo();
  const [demoHydrated, setDemoHydrated] = useState(!staticDemo);

  useEffect(() => {
    if (staticDemo) setDemoHydrated(true);
  }, [staticDemo]);

  if (!demoHydrated) return { date: loadingLabel, localTime: "--:--" };
  return {
    date: formatTodayDate(locale, timeZone),
    localTime: formatCampusTime(locale, timeZone),
  };
}

function usePublishChromeStatus(
  chromeStatus: TodayChromeStatus,
  setChromeStatus: ReturnType<typeof useSetChromeStatus>,
): void {
  // Stack keeps sibling tabs mounted; clear the header chip whenever Today blurs.
  useFocusEffect(
    useCallback(() => {
      setChromeStatus({ label: chromeStatus.label, tone: chromeStatus.tone });
      return () => setChromeStatus(null);
    }, [chromeStatus.label, chromeStatus.tone, setChromeStatus]),
  );
}

function useRefreshAll(
  todayState: ReturnType<typeof useToday>,
  scheduleState: ReturnType<typeof useSchedule>,
  scheduleUnavailable: boolean,
): () => Promise<void> {
  return useCallback(async () => {
    const requests = [todayState.refresh()];
    if (!scheduleUnavailable) requests.push(scheduleState.refresh());
    await Promise.all(requests);
  }, [scheduleState, scheduleUnavailable, todayState]);
}

/** Composes Today while preserving refresh, sorting, and error behavior. */
export default function TodayScreen(): JSX.Element {
  const theme = useTheme();
  const { locale, t } = useLocale();
  const width = useHydratedWindowWidth();
  const isWide = width >= WIDE_BREAKPOINT;
  const timeZone = getInstitutionTimeZone();
  const clock = useDemoSafeCampusClock(locale, timeZone, t("loading"));
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
  usePublishChromeStatus(chromeStatus, setChromeStatus);
  const refreshAll = useRefreshAll(todayState, scheduleState, scheduleUnavailable);

  return (
    <Screen
      refreshing={todayState.refreshing || scheduleState.refreshing}
      onRefresh={() => void refreshAll()}
      maxWidth={1400}
      testID="today-screen"
    >
      <SignalStage
        date={clock.date}
        localTime={clock.localTime}
        nextItem={schedule.items[0]}
        sourceStatus={sourceStatus}
        locale={locale}
        timeZone={timeZone}
        isWide={isWide}
        showFreshnessChip={false}
      />
      <TodayStateNotices todayState={todayState} scheduleState={scheduleState} />
      <TodayAgenda
        isWide={isWide}
        borderColor={theme.colors.border}
        scheduleUnavailable={scheduleUnavailable}
        schedule={schedule}
        scheduleState={scheduleState}
        todayState={todayState}
        sortDirection={sortDirection}
        onToggleSort={() => setSortDirection((value) => (value === "asc" ? "desc" : "asc"))}
      />
    </Screen>
  );
}
