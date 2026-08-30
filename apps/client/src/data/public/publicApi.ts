import {
  EventsResponseSchema,
  PublicRoute,
  type EventsResponse,
  type PublicEventsQuery,
  type PublicRoomsQuery,
  type PublicScheduleQuery,
  type PublicTodayQuery,
  type RoomsResponse,
  RoomsResponseSchema,
  type ScheduleResponse,
  TodayResponseSchema,
  ScheduleResponseSchema,
  type TodayResponse,
} from "@concourse/contracts";
import type { ZodType } from "zod";
import {
  getCachedJson,
  type RequestControls,
  type ResourceLoadResult
} from "./publicApiRequest";

export type EventsQuery = PublicEventsQuery;

type PublicRequestOptions<Q> = Q & RequestControls;
type PublicQuery = Record<string, string | number | undefined>;

function serializeQuery(query: PublicQuery): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).flatMap(([key, value]) => value === undefined || value === "" ? [] : [[key, String(value)]])
  );
}

function fetchPublicResource<T>(
  path: string,
  schema: ZodType<T>,
  keySuffix: string,
  query: PublicQuery,
  controls: RequestControls
): Promise<ResourceLoadResult<T>> {
  return getCachedJson(path, schema, keySuffix, { ...controls, queryParams: serializeQuery(query) });
}

function dispatchPublicEndpoint<T, Q extends PublicQuery>(
  options: PublicRequestOptions<Q>,
  path: string,
  schema: ZodType<T>,
  keySuffix: string
): Promise<ResourceLoadResult<T>> {
  const { force, signal, offlineMode, ...query } = options;

  return fetchPublicResource(path, schema, keySuffix, query, { force, signal, offlineMode });
}

export function fetchEvents(options: PublicRequestOptions<EventsQuery> = {}): Promise<ResourceLoadResult<EventsResponse>> {
  return dispatchPublicEndpoint(options, PublicRoute.events, EventsResponseSchema, "events");
}

export type RoomsQuery = PublicRoomsQuery;

export function fetchRooms(options: PublicRequestOptions<RoomsQuery> = {}): Promise<ResourceLoadResult<RoomsResponse>> {
  return dispatchPublicEndpoint(options, PublicRoute.rooms, RoomsResponseSchema, "rooms");
}

export type TodayQuery = PublicTodayQuery;

export function fetchToday(options: PublicRequestOptions<TodayQuery> = {}): Promise<ResourceLoadResult<TodayResponse>> {
  return dispatchPublicEndpoint(options, PublicRoute.today, TodayResponseSchema, "today");
}

export type ScheduleQuery = PublicScheduleQuery;

export function fetchSchedule(options: PublicRequestOptions<ScheduleQuery> = {}): Promise<ResourceLoadResult<ScheduleResponse>> {
  return dispatchPublicEndpoint(options, PublicRoute.schedule, ScheduleResponseSchema, "schedule");
}
