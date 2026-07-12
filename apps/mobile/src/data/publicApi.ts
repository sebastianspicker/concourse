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
import { getCachedJson } from "./publicApiRequest";
import type { ResourceLoadResult } from "./publicApiRequest";

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

export function fetchEvents(options?: EventsFilterOptions): Promise<ResourceLoadResult<EventsResponse>> {
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

export function fetchRooms(options?: RoomsFilterOptions): Promise<ResourceLoadResult<RoomsResponse>> {
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

export function fetchToday(options?: TodayFetchOptions): Promise<ResourceLoadResult<TodayResponse>> {
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

export function fetchSchedule(options?: ScheduleFilterOptions): Promise<ResourceLoadResult<ScheduleResponse>> {
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
