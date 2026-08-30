import type { InstitutionPack } from "@concourse/institutions";
import { NoConfiguredSourcesError } from "./errors";
import { applyDateRange, applyPagination, applySearch } from "./filters";
import type { PublicDataSources } from "./publicSources";
import type { ScheduleQuery } from "./queries";

export async function getSchedule(institution: InstitutionPack, filter: ScheduleQuery, sources: PublicDataSources) {
  const schedules = institution.publicSources?.schedules ?? [];
  if (schedules.length === 0) throw new NoConfiguredSourcesError("No schedules configured");

  const { schedule, degraded } = await sources.fetchSchedule(institution);
  let filteredSchedule = applyDateRange(schedule, filter.fromDate, filter.toDate, (item) => item.startsAt);
  if (filter.campusId) filteredSchedule = filteredSchedule.filter((item) => item.campusId === filter.campusId);
  filteredSchedule = applySearch(filteredSchedule, filter.search, (item) => item.title);
  const _total = filteredSchedule.length;
  filteredSchedule = applyPagination(filteredSchedule, filter.offset ?? 0, filter.limit);
  return { schedule: filteredSchedule, _total, _degraded: degraded, _sourcesConfigured: true };
}
