import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSetChromeStatus } from "@/shell/ChromeStatusContext";
import { getInstitutionTimeZone } from "@/platform/env/institution";
import { useSchedule } from "@/data/public/useSchedule";
import { useToday } from "@/data/public/useToday";
import { useLocale } from "@/localization/LocaleContext";
import { SignalStage } from "./SignalStage";
import { TodayStateNotices } from "./TodayStateNotices";
import { formatCampusTime, formatTodayDate } from "./todayClockFormat";
import { getTodaySchedule } from "./todaySchedule";
import { getTodayChromeStatus, getTodaySourceStatus } from "./todaySourceStatus";
import { TodayAgenda } from "@/features/today/TodayAgenda";
import type { TodayChromeStatus } from "@/features/today/todaySourceStatus";
import {
  getLocalDayRange,
  isScheduleUnavailable,
  type SortDirection,
} from "@/features/today/todayScreenHelpers";
import { Screen } from "@/design-system/Screen";
import { useTheme } from "@/design-system/ThemeContext";
import { useHydratedWindowWidth } from "@/design-system/useHydratedWindowWidth";
import { isStaticDemo } from "@/data/public/staticDemo";

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
