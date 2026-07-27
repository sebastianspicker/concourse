/** Exposes schedule data through the shared offline-aware resource lifecycle. */
import type { ScheduleResponse } from "../api/types";
import { fetchSchedule, type ScheduleQuery } from "../data/publicApi";
import { useOfflineResource } from "./useOfflineResource";

/** Loads schedule filters through the shared abortable offline-resource lifecycle. */
export function useSchedule(options: ScheduleQuery = {}) {
  return useOfflineResource<ScheduleResponse, ScheduleQuery>(fetchSchedule, options, JSON.stringify(options));
}
