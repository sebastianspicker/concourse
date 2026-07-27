/** Tracks the institution-local date and loads today’s resources across date rollovers. */
import { useEffect, useState } from "react";
import type { TodayResponse } from "../api/types";
import { getInstitutionTimeZone } from "../config/institution";
import { fetchToday } from "../data/publicApi";
import type { PublicResource } from "./usePublicResource";
import { useOfflineResource } from "./useOfflineResource";
import { getCampusDate, millisecondsUntilNextCampusDay } from "../utils/campusTime";

/** Tracks the configured campus date and refreshes at its next local-day boundary. */
export function useCampusDate(timeZone = getInstitutionTimeZone()): string {
  const [currentInstant, setCurrentInstant] = useState(() => new Date());

  useEffect(() => {
/** Advances the local clock state so date-scoped queries refresh at campus midnight. */
    const refreshDate = () => setCurrentInstant(new Date());
    let timeout: ReturnType<typeof setTimeout>;
/** Schedules the next campus-day rollover and recursively re-arms the timer. */
    const scheduleNextRefresh = () => {
      const now = new Date();
      timeout = setTimeout(() => {
        refreshDate();
        scheduleNextRefresh();
      }, millisecondsUntilNextCampusDay(now, timeZone));
    };
    refreshDate();
    scheduleNextRefresh();
    return () => clearTimeout(timeout);
  }, [timeZone]);

  return getCampusDate(currentInstant, timeZone);
}

/** Loads the campus-local Today summary and refreshes its date boundary at midnight. */
export function useToday(): PublicResource<TodayResponse> {
  const campusDate = useCampusDate();
  return useOfflineResource<TodayResponse, { date: string }>(fetchToday, { date: campusDate }, campusDate);
}
