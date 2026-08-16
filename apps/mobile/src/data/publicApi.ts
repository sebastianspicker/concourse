/** Defines typed public-resource fetchers and query normalization for BFF endpoints. */
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
} from "@concourse/shared";
import type { ZodType } from "zod";
import {
  getCachedJson,
  type RequestControls,
  type ResourceLoadResult
} from "./publicApiRequest";

export type EventsQuery = {
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

type PublicRequestOptions<Q> = Q & RequestControls;
type PublicQuery = Record<string, string | number | undefined>;

/** Drops empty query values and stringifies the remaining parameters for the BFF request. */
function serializeQuery(query: PublicQuery): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).flatMap(([key, value]) => value === undefined || value === "" ? [] : [[key, String(value)]])
  );
}

/** Delegates a schema-checked public endpoint request with its cache key and refresh controls. */
function fetchPublicResource<T>(
  path: string,
  schema: ZodType<T>,
  keySuffix: string,
  query: PublicQuery,
  controls: RequestControls
): Promise<ResourceLoadResult<T>> {
  return getCachedJson(path, schema, keySuffix, { ...controls, queryParams: serializeQuery(query) });
}

/** Splits endpoint filters from transport controls before using the shared public-request pipeline. */
function dispatchPublicEndpoint<T, Q extends PublicQuery>(
  options: PublicRequestOptions<Q>,
  path: string,
  schema: ZodType<T>,
  keySuffix: string
): Promise<ResourceLoadResult<T>> {
  const { force, signal, offlineMode, ...query } = options;

  return fetchPublicResource(path, schema, keySuffix, query, { force, signal, offlineMode });
}

/** Requests the `/events` collection after separating transport controls from endpoint filters. */
export function fetchEvents(options: PublicRequestOptions<EventsQuery> = {}): Promise<ResourceLoadResult<EventsResponse>> {
  return dispatchPublicEndpoint(options, "/events", EventsResponseSchema, "events");
}

export type RoomsQuery = {
  campus?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

/** Requests the `/rooms` collection while forwarding only room query filters. */
export function fetchRooms(options: PublicRequestOptions<RoomsQuery> = {}): Promise<ResourceLoadResult<RoomsResponse>> {
  return dispatchPublicEndpoint(options, "/rooms", RoomsResponseSchema, "rooms");
}

export type TodayQuery = {
  date?: string;
};

/** Requests the `/today` summary using the shared validation and cache pipeline. */
export function fetchToday(options: PublicRequestOptions<TodayQuery> = {}): Promise<ResourceLoadResult<TodayResponse>> {
  return dispatchPublicEndpoint(options, "/today", TodayResponseSchema, "today");
}

export type ScheduleQuery = {
  search?: string;
  from?: string;
  to?: string;
  campus?: string;
  limit?: number;
  offset?: number;
};

/** Requests the `/schedule` timeline after normalizing its optional filters. */
export function fetchSchedule(options: PublicRequestOptions<ScheduleQuery> = {}): Promise<ResourceLoadResult<ScheduleResponse>> {
  return dispatchPublicEndpoint(options, "/schedule", ScheduleResponseSchema, "schedule");
}
