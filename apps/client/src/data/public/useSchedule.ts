import type { ScheduleResponse } from "@concourse/contracts";
import { fetchSchedule, type ScheduleQuery } from "./publicApi";
import { useOfflineResource } from "./useOfflineResource";

export function useSchedule(options: ScheduleQuery = {}) {
  return useOfflineResource<ScheduleResponse, ScheduleQuery>(fetchSchedule, options, JSON.stringify(options));
}
