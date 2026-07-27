/** Serves public events for a requested or institution-local calendar day. */

import { TodayResponseSchema, type TodayResponse } from "@concourse/shared";
import type { IncomingMessage } from "node:http";
import type { InstitutionPack } from "../config/loader";
import {
  fetchPublicEvents,
  type FetchPublicEventsResult
} from "../connectors/public/hfmtWebEvents";
import { getDateKeyInTimeZone } from "../utils/timeZone";
import { parseQueryParams, getStringParam } from "../utils/queryParams";
import { createJsonRoute } from "./createJsonRoute";

const DEFAULT_TIME_ZONE = "Europe/Berlin";
const EMPTY_EVENTS_RESULT: FetchPublicEventsResult = { events: [], degraded: false };

/** Accepts only real calendar dates encoded exactly as `YYYY-MM-DD`. */
function isValidDateParam(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() + 1 === Number(match[2]) &&
    date.getUTCDate() === Number(match[3]);
}

const NO_TODAY_SOURCES_ERROR = "NO_CONFIG_SOURCES: No event or room sources configured for today view";

/** Treats either an event source or public room list as sufficient Today configuration. */
function hasConfiguredTodaySources(institution: InstitutionPack): boolean {
  const eventsConfigured = (institution.publicSources?.events?.length ?? 0) > 0;
  const roomsConfigured = (institution.publicRooms?.length ?? 0) > 0;
  return eventsConfigured || roomsConfigured;
}

const TODAY_MAX_AGE_SECONDS = 300;

/** Fetches configured event sources or returns a non-degraded empty result when absent. */
async function loadTodayEvents(institution: InstitutionPack): Promise<FetchPublicEventsResult> {
  const eventsConfigured = (institution.publicSources?.events?.length ?? 0) > 0;
  return eventsConfigured ? fetchPublicEvents(institution) : EMPTY_EVENTS_RESULT;
}

const DATE_QUERY_PARAM = "date";

/** Converts the deterministic fixture clock into the institution-local date, or uses now if invalid. */
function resolveEnvDate(dateValue: string, timeZone: string): string {
  const now = new Date(dateValue);
  return getDateKeyInTimeZone(Number.isNaN(now.getTime()) ? new Date() : now, timeZone);
}

/** Resolves the Today date from a validated query, fixture clock, or institution-local now. */
function resolveTodayDate(req: IncomingMessage, timeZone: string): string {
  const params = parseQueryParams(req);
  const clientDate = getStringParam(params, DATE_QUERY_PARAM);
  if (clientDate !== undefined) {
    if (isValidDateParam(clientDate)) return clientDate;
    throw new Error("INVALID_QUERY_PARAM: date must be a valid YYYY-MM-DD calendar date");
  }
  if (process.env.PUBLIC_EVENTS_DATE) return resolveEnvDate(process.env.PUBLIC_EVENTS_DATE, timeZone);
  return getDateKeyInTimeZone(new Date(), timeZone);
}

const DEGRADED_HEADER = "x-data-degraded";

/** Keeps events on the requested institution-local date and drops malformed timestamps. */
function filterEventsForDate(events: TodayResponse["events"], todayStr: string, timeZone: string): TodayResponse["events"] {
  return events.filter((event) => {
    try {
      return getDateKeyInTimeZone(event.date, timeZone) === todayStr;
    } catch {
      return false;
    }
  });
}

/** Aggregates date-filtered public events and rooms while preserving degraded-source state. */
async function loadToday(institution: InstitutionPack, req: IncomingMessage): Promise<TodayResponse> {
  if (!hasConfiguredTodaySources(institution)) {
    throw new Error(NO_TODAY_SOURCES_ERROR);
  }

  const timeZone = institution.timezone ?? DEFAULT_TIME_ZONE;
  const todayStr = resolveTodayDate(req, timeZone);
  const { events, degraded } = await loadTodayEvents(institution);

  return {
    events: filterEventsForDate(events, todayStr, timeZone),
    rooms: institution.publicRooms ?? [],
    _degraded: degraded,
    _sourcesConfigured: true
  };
}

/** Exposes degraded and fixture modes as response metadata for clients and tests. */
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
