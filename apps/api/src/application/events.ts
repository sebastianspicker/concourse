import type { InstitutionPack } from "@concourse/institutions";
import { NoConfiguredSourcesError } from "./errors";
import { applyDateRange, applyPagination, applySearch } from "./filters";
import type { PublicDataSources } from "./publicSources";
import type { EventsQuery } from "./queries";

export async function getEvents(institution: InstitutionPack, filter: EventsQuery, sources: PublicDataSources) {
  const configuredSources = institution.publicSources?.events ?? [];
  if (configuredSources.length === 0) throw new NoConfiguredSourcesError("No event sources configured");

  const { events, degraded } = await sources.fetchEvents(institution);
  let filteredEvents = applySearch(events, filter.search, (event) => event.title);
  filteredEvents = applyDateRange(filteredEvents, filter.fromDate, filter.toDate, (event) => event.date);
  const _total = filteredEvents.length;
  filteredEvents = applyPagination(filteredEvents, filter.offset ?? 0, filter.limit);
  return { events: filteredEvents, _total, _degraded: degraded, _sourcesConfigured: true };
}
