/** Serves filtered public event data from configured public sources. */

import { EventsResponseSchema } from "@concourse/shared";
import { fetchPublicEvents } from "../connectors/public/hfmtWebEvents";
import { parseQueryParams, parseEventsFilter } from "../utils/queryParams";
import { applySearch, applyDateRange, applyPagination } from "../utils/filterHelpers";
import { createJsonRoute } from "./createJsonRoute";
import { publicDataHeaders } from "./publicDataHeaders";

export const handleEvents = createJsonRoute(
  async (institution, req) => {
    const params = parseQueryParams(req);
    const filter = parseEventsFilter(params);

    const sources = institution.publicSources?.events ?? [];
    if (sources.length === 0) {
      throw new Error("NO_CONFIG_SOURCES: No event sources configured");
    }

    const { events, degraded } = await fetchPublicEvents(institution);

    let filteredEvents = applySearch(events, filter.search, (e) => e.title);
    filteredEvents = applyDateRange(filteredEvents, filter.fromDate, filter.toDate, (e) => e.date);
    const _total = filteredEvents.length;
    filteredEvents = applyPagination(filteredEvents, filter.offset ?? 0, filter.limit);

    return {
      events: filteredEvents,
      _total,
      _degraded: degraded,
      _sourcesConfigured: true
    };
  },
  EventsResponseSchema,
  {
    maxAgeSeconds: 300,
    getExtraHeaders: publicDataHeaders
  }
);
