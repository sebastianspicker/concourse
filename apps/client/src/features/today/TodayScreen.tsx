import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Platform } from "react-native";
import { useSetChromeStatus } from "@/shell/ChromeStatusContext";
import { getInstitutionTimeZone } from "@/platform/env/institution";
import { useSchedule, useToday } from "@/data/public/resources";
import { useLocale } from "@/localization/LocaleContext";
import { useMinuteTick } from "@/localization/useMinuteTick";
import { SignalStage } from "./SignalStage";
import { TodayAgenda, TodayStateNotices } from "./TodayAgenda";
import {
  formatCampusTime,
  formatTodayDate,
  getTodayChromeStatus,
  getTodaySourceStatus,
  type BoardScheduleState,
  type TodayChromeStatus,
} from "./todaySourceStatus";
import {
  getLocalDayRange,
  getNowAndNext,
  getTodaySchedule,
  isScheduleUnavailable,
} from "./todayScreenHelpers";
import { Screen } from "@/design-system/Screen";
import { getErrorMessageKey } from "@/design-system/errorStatePresentation";
import { CONTENT_MAX_WIDTH } from "@/design-system/theme";
import type { SortDirection } from "@/design-system/SortButton";
import { useTheme } from "@/design-system/ThemeProvider";
import { useHydratedWindowWidth } from "@/design-system/useHydratedWindowWidth";

const WIDE_BREAKPOINT = 900;

/** The board only names entries it has; while loading or failing it says so instead. */
function getBoardScheduleState(
  scheduleState: ReturnType<typeof useSchedule>,
  scheduleUnavailable: boolean,
  t: ReturnType<typeof useLocale>["t"],
): BoardScheduleState {
  if (scheduleState.data) return { kind: "ready" };
  if (scheduleUnavailable) return { kind: "unavailable", reason: t("errorUnavailable") };
  if (scheduleState.error) return { kind: "unavailable", reason: t(getErrorMessageKey(scheduleState.error)) };
  return scheduleState.loading ? { kind: "loading" } : { kind: "ready" };
}

/** Keeps exported web clock markup stable until hydration; native clocks render immediately. */
function useHydratedCampusClock(now: Date, locale: string, timeZone: string, loadingLabel: string) {
  const [hydrated, setHydrated] = useState(Platform.OS !== "web");

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return { date: loadingLabel, localTime: "--:--" };
  return {
    date: formatTodayDate(locale, timeZone, now),
    localTime: formatCampusTime(locale, timeZone, now),
  };
}

function usePublishChromeStatus(
  chromeStatus: TodayChromeStatus,
  setChromeStatus: ReturnType<typeof useSetChromeStatus>,
): void {
  // Stack keeps sibling tabs mounted; clear the header status whenever Today blurs.
  useFocusEffect(
    useCallback(() => {
      setChromeStatus({ label: chromeStatus.label, tone: chromeStatus.tone, lamp: chromeStatus.lamp });
      return () => setChromeStatus(null);
    }, [chromeStatus.label, chromeStatus.lamp, chromeStatus.tone, setChromeStatus]),
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
  const now = useMinuteTick();
  const clock = useHydratedCampusClock(now, locale, timeZone, t("loading"));
  const todayState = useToday();
  const scheduleState = useSchedule(getLocalDayRange(now, timeZone));
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const setChromeStatus = useSetChromeStatus();
  const scheduleUnavailable = isScheduleUnavailable(scheduleState.error);
  const schedule = getTodaySchedule(scheduleState.data, sortDirection);
  const selection = useMemo(() => getNowAndNext(scheduleState.data?.schedule ?? [], now), [now, scheduleState.data]);
  const sourceStatus = getTodaySourceStatus({
    cached: [todayState.source, scheduleState.source].includes("persisted-cache"),
    degraded: [todayState.data?._degraded, scheduleState.data?._degraded, scheduleUnavailable].some(Boolean),
    loading: [todayState.loading, scheduleState.loading].some(Boolean),
    unavailable: todayState.error !== null || (!scheduleUnavailable && scheduleState.error !== null),
    theme,
    t,
  });
  const chromeStatus = getTodayChromeStatus(sourceStatus, t, theme.colors, !isWide);
  usePublishChromeStatus(chromeStatus, setChromeStatus);
  const refreshAll = useRefreshAll(todayState, scheduleState, scheduleUnavailable);

  return (
    <Screen
      refreshing={todayState.refreshing || scheduleState.refreshing}
      onRefresh={() => void refreshAll()}
      maxWidth={CONTENT_MAX_WIDTH}
      testID="today-screen"
    >
      <SignalStage
        date={clock.date}
        localTime={clock.localTime}
        current={selection.current}
        next={selection.next}
        schedule={getBoardScheduleState(scheduleState, scheduleUnavailable, t)}
        scheduleSource={scheduleState.source}
        locale={locale}
        timeZone={timeZone}
        isWide={isWide}
      />
      <TodayStateNotices todayState={todayState} scheduleState={scheduleState} />
      <TodayAgenda
        isWide={isWide}
        scheduleUnavailable={scheduleUnavailable}
        schedule={schedule}
        selection={selection}
        now={now}
        scheduleState={scheduleState}
        todayState={todayState}
        sortDirection={sortDirection}
        onToggleSort={() => setSortDirection((value) => (value === "asc" ? "desc" : "asc"))}
      />
    </Screen>
  );
}
