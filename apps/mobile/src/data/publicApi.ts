import type { z } from "zod";
import { ZodError } from "zod";
import { getJson } from "../api/client";
import { ApiErrorException } from "../api/errors";
import type {
  EventsResponse,
  RoomsResponse,
  TodayResponse,
  ScheduleResponse
} from "../api/types";
import {
  EventsResponseSchema,
  RoomsResponseSchema,
  TodayResponseSchema,
  ScheduleResponseSchema
} from "@campus/shared";
import { getBffBaseUrl } from "../utils/env";
import { getCached } from "./cache";
import { fetchNetworkFirstWithFallback } from "./persistedCache";

const DEFAULT_TTL_MS = 60_000;

function getPublicCacheKey(suffix: string, queryParams?: Record<string, string>): string {
  try {
    // Include the BFF base URL so preview/prod/dev endpoints do not share
    // persisted responses when a tester switches environments.
    const base = `public:${getBffBaseUrl()}:${suffix}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const sortedParams = Object.entries(queryParams)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
      return `${base}?${sortedParams}`;
    }
    return base;
  } catch {
    return `public:${suffix}`;
  }
}

function safeParse<T>(data: unknown, schema: z.ZodType<T>): T {
  try {
    return schema.parse(data) as T;
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      throw new ApiErrorException({
        status: 502,
        code: "validation_error",
        message: "Invalid response format"
      });
    }
    throw err;
  }
}

async function getCachedJson<T>(
  path: string,
  schema: z.ZodType<T>,
  keySuffix: string,
  options?: { force?: boolean; signal?: AbortSignal; queryParams?: Record<string, string>; offlineMode?: boolean }
): Promise<T> {
  const cacheKey = getPublicCacheKey(keySuffix, options?.queryParams);
  const queryString = options?.queryParams 
    ? `?${new URLSearchParams(options.queryParams).toString()}`
    : "";
  
  if (options?.offlineMode) {
    const result = await fetchNetworkFirstWithFallback<T>(
      cacheKey,
      () => getJson<T>(`${path}${queryString}`, (data) => safeParse(data, schema), { signal: options?.signal })
    );
    return result.data;
  }
  
  return getCached(
    cacheKey,
    () =>
      getJson<T>(`${path}${queryString}`, (data) => safeParse(data, schema), { signal: options?.signal }),
    DEFAULT_TTL_MS,
    options?.force ?? false
  );
}

export type EventsFilterOptions = {
  force?: boolean;
  signal?: AbortSignal;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  offlineMode?: boolean;
};

export function fetchEvents(options?: EventsFilterOptions): Promise<EventsResponse> {
  const queryParams: Record<string, string> = {};
  if (options?.search) queryParams.search = options.search;
  if (options?.from) queryParams.from = options.from;
  if (options?.to) queryParams.to = options.to;
  if (options?.limit !== undefined) queryParams.limit = String(options.limit);
  if (options?.offset !== undefined) queryParams.offset = String(options.offset);
  
  return getCachedJson("/events", EventsResponseSchema, "events", {
    force: options?.force,
    signal: options?.signal,
    queryParams,
    offlineMode: options?.offlineMode
  });
}

export type RoomsFilterOptions = {
  force?: boolean;
  signal?: AbortSignal;
  campus?: string;
  search?: string;
  limit?: number;
  offset?: number;
  offlineMode?: boolean;
};

export function fetchRooms(options?: RoomsFilterOptions): Promise<RoomsResponse> {
  const queryParams: Record<string, string> = {};
  if (options?.campus) queryParams.campus = options.campus;
  if (options?.search) queryParams.search = options.search;
  if (options?.limit !== undefined) queryParams.limit = String(options.limit);
  if (options?.offset !== undefined) queryParams.offset = String(options.offset);
  
  return getCachedJson("/rooms", RoomsResponseSchema, "rooms", {
    force: options?.force,
    signal: options?.signal,
    queryParams,
    offlineMode: options?.offlineMode
  });
}

export type TodayFetchOptions = {
  force?: boolean;
  signal?: AbortSignal;
  offlineMode?: boolean;
  date?: string;
};

export function fetchToday(options?: TodayFetchOptions): Promise<TodayResponse> {
  const queryParams: Record<string, string> = {};
  if (options?.date) queryParams.date = options.date;

  return getCachedJson("/today", TodayResponseSchema, "today", {
    force: options?.force,
    signal: options?.signal,
    queryParams,
    offlineMode: options?.offlineMode
  });
}

export type ScheduleFilterOptions = {
  force?: boolean;
  signal?: AbortSignal;
  search?: string;
  from?: string;
  to?: string;
  campus?: string;
  limit?: number;
  offset?: number;
  offlineMode?: boolean;
};

export function fetchSchedule(options?: ScheduleFilterOptions): Promise<ScheduleResponse> {
  const queryParams: Record<string, string> = {};
  if (options?.search) queryParams.search = options.search;
  if (options?.from) queryParams.from = options.from;
  if (options?.to) queryParams.to = options.to;
  if (options?.campus) queryParams.campus = options.campus;
  if (options?.limit !== undefined) queryParams.limit = String(options.limit);
  if (options?.offset !== undefined) queryParams.offset = String(options.offset);
  
  return getCachedJson("/schedule", ScheduleResponseSchema, "schedule", {
    force: options?.force,
    signal: options?.signal,
    queryParams,
    offlineMode: options?.offlineMode
  });
}
