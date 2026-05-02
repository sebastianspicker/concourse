import type { ScheduleResponse } from "@campus/shared";
import { ScheduleResponseSchema } from "@campus/shared";
import { fetchPublicSchedule } from "../connectors/public/publicSchedule";
import { parseQueryParams, parseScheduleFilter } from "../utils/queryParams";
import { applySearch, applyDateRange, applyPagination } from "../utils/filterHelpers";
import { createJsonRoute } from "./createJsonRoute";

export const handleSchedule = createJsonRoute(
  async (institution, req) => {
    const schedules = institution.publicSources?.schedules ?? [];
    if (schedules.length === 0) {
      throw new Error("NO_CONFIG_SOURCES: No schedules configured");
    }

    const { schedule, degraded } = await fetchPublicSchedule(institution);

    const params = parseQueryParams(req);
    const filter = parseScheduleFilter(params);

    let filteredSchedule = applyDateRange(schedule, filter.fromDate, filter.toDate, (item) => item.startsAt);
    if (filter.campusId) {
      filteredSchedule = filteredSchedule.filter((item) => item.campusId === filter.campusId);
    }
    filteredSchedule = applySearch(filteredSchedule, filter.search, (item) => item.title);
    const _total = filteredSchedule.length;
    filteredSchedule = applyPagination(filteredSchedule, filter.offset ?? 0, filter.limit);

    return {
      schedule: filteredSchedule,
      _total,
      _degraded: degraded,
      _sourcesConfigured: true
    };
  },
  ScheduleResponseSchema,
  {
    maxAgeSeconds: 300,
    getExtraHeaders: (data: ScheduleResponse) => ({
      ...(data._degraded ? { "x-data-degraded": "true" } : {}),
      ...(process.env.PUBLIC_EVENTS_MODE === "mock" ? { "x-data-mode": "mock" } : {})
    })
  }
);
