import React, { useCallback, useMemo, useState } from "react";
import { DegradedBanner } from "@/components/DegradedBanner";
import { useToday } from "@/hooks/useToday";
import { useSchedule } from "@/hooks/useSchedule";
import {
  getLocalDayRange,
  isScheduleUnavailable,
  sortScheduleItems
} from "@/screens/todayScreenHelpers";
import type { SortDirection } from "@/screens/todayScreenHelpers";
import { TodayEventsSection } from "@/screens/todayEventsSection";
import { TodayHero } from "@/screens/todayHero";
import { ScheduleSection } from "@/screens/todayScheduleSection";
import { Screen } from "@/ui/Screen";

export default function TodayScreen(): JSX.Element {
  const { data, error, loading, refreshing, refresh } = useToday();
  const today = new Date().toDateString();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scheduleFilter = useMemo(() => getLocalDayRange(), [today]);
  const scheduleState = useSchedule(scheduleFilter);
  const [scheduleSortDirection, setScheduleSortDirection] = useState<SortDirection>("asc");
  const scheduleUnavailable = isScheduleUnavailable(scheduleState.error);
  const scheduleRefresh = scheduleState.refresh;

  const refreshAll = useCallback(async () => {
    if (scheduleUnavailable) {
      await refresh();
      return;
    }
    await Promise.all([refresh(), scheduleRefresh()]);
  }, [refresh, scheduleRefresh, scheduleUnavailable]);

  const events = data?.events ?? [];
  const sortedSchedule = sortScheduleItems(scheduleState.data?.schedule ?? [], scheduleSortDirection);
  const showScheduleSection = !scheduleUnavailable;
  const toggleScheduleSort = useCallback(() => {
    setScheduleSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  return (
    <Screen refreshing={refreshing || scheduleState.refreshing} onRefresh={refreshAll}>
      <TodayHero
        loading={loading || scheduleState.loading}
        eventCount={events.length}
        scheduleCount={sortedSchedule.length}
        showScheduleSection={showScheduleSection}
      />
      <DegradedBanner visible={data?._degraded === true} />
      <TodayEventsSection loading={loading} error={error} events={events} onRetry={refreshAll} />
      {showScheduleSection ? (
        <ScheduleSection
          sortDirection={scheduleSortDirection}
          onToggleSort={toggleScheduleSort}
          loading={scheduleState.loading}
          error={scheduleState.error}
          items={sortedSchedule}
          onRetry={refreshAll}
        />
      ) : null}
    </Screen>
  );
}
