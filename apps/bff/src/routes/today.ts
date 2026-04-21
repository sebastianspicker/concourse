import type { TodayResponse } from "@campus/shared";
import { TodayResponseSchema } from "@campus/shared";
import { fetchPublicEvents } from "../connectors/public/hfmtWebEvents";
import { getDateKeyInTimeZone } from "../utils/timeZone";
import { parseQueryParams, getStringParam } from "../utils/queryParams";
import { createJsonRoute } from "./createJsonRoute";

const DEFAULT_TIME_ZONE = "Europe/Berlin";

/** Validate that a string is a YYYY-MM-DD date */
function isValidDateParam(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

export const handleToday = createJsonRoute(
  async (institution, req) => {
    const eventsConfigured = (institution.publicSources?.events?.length ?? 0) > 0;
    const roomsConfigured = (institution.publicRooms?.length ?? 0) > 0;

    if (!eventsConfigured && !roomsConfigured) {
      throw new Error("NO_CONFIG_SOURCES: No event or room sources configured for today view");
    }

    const eventsResult = eventsConfigured
      ? await fetchPublicEvents(institution)
      : { events: [], degraded: false };
    const { events, degraded } = eventsResult;

    const timeZone = institution.timezone ?? DEFAULT_TIME_ZONE;

    // Date scoping: filter to today.
    // Accept an optional `date` query param from the client so the mobile app can
    // send its local date instead of relying on server UTC.
    // Also respect PUBLIC_EVENTS_DATE env var for test fixtures.
    const params = parseQueryParams(req);
    const clientDate = getStringParam(params, "date");
    const envDate = process.env.PUBLIC_EVENTS_DATE;

    let todayStr: string;
    if (clientDate && isValidDateParam(clientDate)) {
      todayStr = clientDate;
    } else if (envDate) {
      let now = new Date(envDate);
      if (isNaN(now.getTime())) now = new Date();
      todayStr = getDateKeyInTimeZone(now, timeZone);
    } else {
      todayStr = getDateKeyInTimeZone(new Date(), timeZone);
    }
    const todayEvents = events.filter((event) => {
      try {
        return getDateKeyInTimeZone(event.date, timeZone) === todayStr;
      } catch {
        return false;
      }
    });

    return {
      events: todayEvents,
      rooms: institution.publicRooms ?? [],
      _degraded: degraded,
      _sourcesConfigured: true
    };
  },
  TodayResponseSchema,
  {
    maxAgeSeconds: 300,
    getExtraHeaders: (data: TodayResponse) => ({
      ...(data._degraded ? { "x-data-degraded": "true" } : {}),
      ...(process.env.PUBLIC_EVENTS_MODE === "mock" ? { "x-data-mode": "mock" } : {})
    })
  }
);
