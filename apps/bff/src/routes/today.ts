import type { TodayResponse } from "@campus/shared";
import { TodayResponseSchema } from "@campus/shared";
import type { IncomingMessage } from "node:http";
import type { InstitutionPack } from "../config/loader";
import { fetchPublicEvents } from "../connectors/public/hfmtWebEvents";
import type { FetchPublicEventsResult } from "../connectors/public/hfmtWebEvents";
import { getDateKeyInTimeZone } from "../utils/timeZone";
import { parseQueryParams, getStringParam } from "../utils/queryParams";
import { createJsonRoute } from "./createJsonRoute";

const DEFAULT_TIME_ZONE = "Europe/Berlin";
const EMPTY_EVENTS_RESULT: FetchPublicEventsResult = { events: [], degraded: false };

/** Validate that a string is a YYYY-MM-DD date */
function isValidDateParam(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

const NO_TODAY_SOURCES_ERROR = "NO_CONFIG_SOURCES: No event or room sources configured for today view";

function hasConfiguredTodaySources(institution: InstitutionPack): boolean {
  const eventsConfigured = (institution.publicSources?.events?.length ?? 0) > 0;
  const roomsConfigured = (institution.publicRooms?.length ?? 0) > 0;
  return eventsConfigured || roomsConfigured;
}

const TODAY_MAX_AGE_SECONDS = 300;

async function loadTodayEvents(institution: InstitutionPack): Promise<FetchPublicEventsResult> {
  const eventsConfigured = (institution.publicSources?.events?.length ?? 0) > 0;
  return eventsConfigured ? fetchPublicEvents(institution) : EMPTY_EVENTS_RESULT;
}

const DATE_QUERY_PARAM = "date";

function resolveEnvDate(dateValue: string, timeZone: string): string {
  const now = new Date(dateValue);
  return getDateKeyInTimeZone(Number.isNaN(now.getTime()) ? new Date() : now, timeZone);
}

function resolveTodayDate(req: IncomingMessage, timeZone: string): string {
  const params = parseQueryParams(req);
  const clientDate = getStringParam(params, DATE_QUERY_PARAM);
  if (clientDate && isValidDateParam(clientDate)) return clientDate;
  if (process.env.PUBLIC_EVENTS_DATE) return resolveEnvDate(process.env.PUBLIC_EVENTS_DATE, timeZone);
  return getDateKeyInTimeZone(new Date(), timeZone);
}

const DEGRADED_HEADER = "x-data-degraded";

function filterEventsForDate(events: TodayResponse["events"], todayStr: string, timeZone: string): TodayResponse["events"] {
  return events.filter((event) => {
    try {
      return getDateKeyInTimeZone(event.date, timeZone) === todayStr;
    } catch {
      return false;
    }
  });
}

async function loadToday(institution: InstitutionPack, req: IncomingMessage): Promise<TodayResponse> {
  if (!hasConfiguredTodaySources(institution)) {
    throw new Error(NO_TODAY_SOURCES_ERROR);
  }

  const { events, degraded } = await loadTodayEvents(institution);
  const timeZone = institution.timezone ?? DEFAULT_TIME_ZONE;
  const todayStr = resolveTodayDate(req, timeZone);

  return {
    events: filterEventsForDate(events, todayStr, timeZone),
    rooms: institution.publicRooms ?? [],
    _degraded: degraded,
    _sourcesConfigured: true
  };
}

function getTodayHeaders(data: TodayResponse): Record<string, string> {
  return {
    ...(data._degraded ? { [DEGRADED_HEADER]: "true" } : {}),
    ...(process.env.PUBLIC_EVENTS_MODE === "mock" ? { "x-data-mode": "mock" } : {})
  };
}

export const handleToday = createJsonRoute(
  loadToday,
  TodayResponseSchema,
  {
    maxAgeSeconds: TODAY_MAX_AGE_SECONDS,
    getExtraHeaders: getTodayHeaders
  }
);
