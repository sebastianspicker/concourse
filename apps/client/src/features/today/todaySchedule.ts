import type { ScheduleItem, ScheduleResponse } from "@concourse/contracts";
import { sortScheduleItems, type SortDirection } from "@/features/today/todayScreenHelpers";

export const TODAY_SCHEDULE_LIMIT = 50;

export type TodayScheduleSlice = {
  items: ScheduleItem[];
  total: number;
};

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
