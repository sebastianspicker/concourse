/** Parses and validates query parameters shared by public data routes. */

import type { IncomingMessage } from "node:http";

/**
 * Parse query parameters from a request URL.
 */
/** Parses the request URL or raises a route-level invalid-query error. */
export function parseQueryParams(req: IncomingMessage): URLSearchParams {
  const url = req.url ?? "";
  try {
    const fullUrl = new URL(url, "http://localhost");
    return fullUrl.searchParams;
  } catch {
    return new URLSearchParams();
  }
}

/**
 * Get a string query parameter with optional default value.
 */
export function getStringParam(
  params: URLSearchParams,
  key: string,
  defaultValue?: string
): string | undefined {
  return params.get(key) ?? defaultValue;
}

/**
 * Get a number query parameter with optional default value.
 * Returns undefined if the parameter is not present or not a valid number.
 */
/** Reads a finite numeric query value within optional bounds. */
export function getNumberParam(
  params: URLSearchParams,
  key: string,
  defaultValue?: number
): number | undefined {
  const value = params.get(key);
  if (value === null) return defaultValue;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return defaultValue;
  return parsed;
}

// Invalid limits are rejected instead of clamped so callers notice broken
// pagination requests and the BFF cannot accidentally serve huge payloads.
/** Parses a pagination limit and clamps it to the public route maximum. */
function getBoundedLimitParam(params: URLSearchParams, key: string): number | undefined {
  const value = params.get(key);
  if (value === null) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
    throw new Error(`INVALID_QUERY_PARAM: ${key} must be an integer between 1 and 1000`);
  }
  return parsed;
}

/**
 * Get a date query parameter (ISO 8601 format).
 * Returns undefined if the parameter is not present or not a valid date.
 */
/** Reads a strict ISO date query value rather than accepting Date parser variants. */
export function getDateParam(
  params: URLSearchParams,
  key: string
): Date | undefined {
  const value = params.get(key);
  if (value === null) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

/**
 * Filter options for events endpoint.
 */
export interface EventsFilterOptions {
  /** Search term for event title (case-insensitive partial match) */
  search?: string;
  /** Filter events starting from this date */
  fromDate?: Date;
  /** Filter events until this date */
  toDate?: Date;
  /** Maximum number of events to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

type DateRangePaginationFilterOptions = Pick<
  EventsFilterOptions,
  "search" | "fromDate" | "toDate" | "limit" | "offset"
>;

/** Parses the shared public-route date-range, search, and pagination parameters. */
function parseDateRangePaginationFilter(params: URLSearchParams): DateRangePaginationFilterOptions {
  const limit = getBoundedLimitParam(params, "limit");
  return {
    search: getStringParam(params, "search")?.slice(0, 200),
    fromDate: getDateParam(params, "from"),
    toDate: getDateParam(params, "to"),
    limit,
    offset: Math.max(0, Math.floor(getNumberParam(params, "offset") ?? 0))
  };
}

/**
 * Parse filter options from query parameters for events endpoint.
 */
export function parseEventsFilter(params: URLSearchParams): EventsFilterOptions {
  return parseDateRangePaginationFilter(params);
}

/**
 * Filter options for schedule endpoint.
 */
export interface ScheduleFilterOptions {
  /** Search term for schedule item title (case-insensitive partial match) */
  search?: string;
  /** Filter schedule items starting from this date */
  fromDate?: Date;
  /** Filter schedule items until this date */
  toDate?: Date;
  /** Filter by campus ID */
  campusId?: string;
  /** Maximum number of items to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Parse filter options from query parameters for schedule endpoint.
 */
export function parseScheduleFilter(params: URLSearchParams): ScheduleFilterOptions {
  return {
    ...parseDateRangePaginationFilter(params),
    campusId: getStringParam(params, "campus")?.slice(0, 100),
  };
}

/**
 * Filter options for rooms endpoint.
 */
export interface RoomsFilterOptions {
  /** Filter by campus ID */
  campus?: string;
  /** Search term for room name (case-insensitive partial match) */
  search?: string;
  /** Maximum number of rooms to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Parse filter options from query parameters for rooms endpoint.
 */
export function parseRoomsFilter(params: URLSearchParams): RoomsFilterOptions {
  const limit = getBoundedLimitParam(params, "limit");
  return {
    campus: getStringParam(params, "campus")?.slice(0, 100),
    search: getStringParam(params, "search")?.slice(0, 200),
    limit,
    offset: Math.max(0, Math.floor(getNumberParam(params, "offset") ?? 0))
  };
}
