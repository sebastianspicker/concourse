import type { IncomingMessage } from "node:http";

/**
 * Parse query parameters from a request URL.
 */
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

/**
 * Get a date query parameter (ISO 8601 format).
 * Returns undefined if the parameter is not present or not a valid date.
 */
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

/**
 * Parse filter options from query parameters for events endpoint.
 */
export function parseEventsFilter(params: URLSearchParams): EventsFilterOptions {
  const limit = getNumberParam(params, "limit");
  return {
    search: getStringParam(params, "search")?.slice(0, 200),
    fromDate: getDateParam(params, "from"),
    toDate: getDateParam(params, "to"),
    limit: limit !== undefined ? Math.min(Math.max(0, Math.floor(limit)), 1000) : undefined,
    offset: Math.max(0, Math.floor(getNumberParam(params, "offset") ?? 0))
  };
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
  const limit = getNumberParam(params, "limit");
  return {
    search: getStringParam(params, "search")?.slice(0, 200),
    fromDate: getDateParam(params, "from"),
    toDate: getDateParam(params, "to"),
    campusId: getStringParam(params, "campus")?.slice(0, 100),
    limit: limit !== undefined ? Math.min(Math.max(0, Math.floor(limit)), 1000) : undefined,
    offset: Math.max(0, Math.floor(getNumberParam(params, "offset") ?? 0))
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
  const limit = getNumberParam(params, "limit");
  return {
    campus: getStringParam(params, "campus")?.slice(0, 100),
    search: getStringParam(params, "search")?.slice(0, 200),
    limit: limit !== undefined ? Math.min(Math.max(0, Math.floor(limit)), 1000) : undefined,
    offset: Math.max(0, Math.floor(getNumberParam(params, "offset") ?? 0))
  };
}
