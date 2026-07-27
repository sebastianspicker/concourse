/** Limits and sorts today’s public schedule for the Signal Board and agenda. */
import type { ScheduleItem, ScheduleResponse } from "@concourse/shared";
import { sortScheduleItems, type SortDirection } from "@/screens/todayScreenHelpers";

export const TODAY_SCHEDULE_LIMIT = 50;

export type TodayScheduleSlice = {
  items: ScheduleItem[];
  total: number;
};

/** Returns the sorted, capped schedule slice used by the Now/Next board and agenda. */
export function getTodaySchedule(
  data: ScheduleResponse | null,
  direction: SortDirection,
): TodayScheduleSlice {
  const items = sortScheduleItems(data?.schedule ?? [], direction);
  return {
    items: items.slice(0, TODAY_SCHEDULE_LIMIT),
    total: data?._total ?? items.length,
  };
}
