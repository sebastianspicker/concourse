import {
  EventsResponseSchema,
  PublicQueryKey,
  PublicRoute,
  RoomsResponseSchema,
  ScheduleResponseSchema,
  TodayResponseSchema,
  type PublicDataRoute,
  type TodayResponse
} from "@concourse/contracts";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { InstitutionPack } from "@concourse/institutions";
import { getEvents } from "../application/events";
import { getRooms } from "../application/rooms";
import { getSchedule } from "../application/schedule";
import { getToday } from "../application/today";
import type { PublicDataSources } from "../application/publicSources";
import { fetchPublicSchedule } from "../sources/ics/publicSchedule";
import { fetchPublicEvents } from "../sources/web-events/hfmtWebEvents";
import { createJsonRoute } from "./jsonRoute";
import { publicDataHeaders } from "./publicDataHeaders";
import { getStringParam, parseEventsQuery, parseQueryParams, parseRoomsQuery, parseScheduleQuery } from "./query";

const productionPublicDataSources: PublicDataSources = { fetchEvents: fetchPublicEvents, fetchSchedule: fetchPublicSchedule };
type DataRouteHandler = (req: IncomingMessage, res: ServerResponse, institution: InstitutionPack, requestId?: string) => Promise<void>;

export type DataRouteDependencies = {
  publicDataSources?: PublicDataSources;
  now?: Date;
};

export type DataRouteHandlers = Record<PublicDataRoute, DataRouteHandler>;

export function createDataRouteHandlers(dependencies: DataRouteDependencies = {}): DataRouteHandlers {
  const publicDataSources = dependencies.publicDataSources ?? productionPublicDataSources;
  return {
    [PublicRoute.events]: createJsonRoute(
      (institution, req) => getEvents(institution, parseEventsQuery(parseQueryParams(req)), publicDataSources),
      EventsResponseSchema,
      { maxAgeSeconds: 300, getExtraHeaders: publicDataHeaders }
    ),
    [PublicRoute.rooms]: createJsonRoute(
      (institution, req) => getRooms(institution, parseRoomsQuery(parseQueryParams(req))),
      RoomsResponseSchema,
      { maxAgeSeconds: 300 }
    ),
    [PublicRoute.schedule]: createJsonRoute(
      (institution, req) => getSchedule(institution, parseScheduleQuery(parseQueryParams(req)), publicDataSources),
      ScheduleResponseSchema,
      { maxAgeSeconds: 300, getExtraHeaders: publicDataHeaders }
    ),
    [PublicRoute.today]: createJsonRoute(
      (institution, req) => getToday(
        institution,
        getStringParam(parseQueryParams(req), PublicQueryKey.date),
        publicDataSources,
        dependencies.now ?? configuredNow()
      ),
      TodayResponseSchema,
      { maxAgeSeconds: 300, getExtraHeaders: todayHeaders }
    )
  };
}

const productionDataRouteHandlers = createDataRouteHandlers();

export const handleEvents = productionDataRouteHandlers[PublicRoute.events];
export const handleRooms = productionDataRouteHandlers[PublicRoute.rooms];
export const handleSchedule = productionDataRouteHandlers[PublicRoute.schedule];
export const handleToday = productionDataRouteHandlers[PublicRoute.today];

function todayHeaders(data: TodayResponse): Record<string, string> {
  return publicDataHeaders(data);
}

function configuredNow(): Date {
  const candidate = process.env.PUBLIC_EVENTS_DATE ? new Date(process.env.PUBLIC_EVENTS_DATE) : new Date();
  return Number.isNaN(candidate.getTime()) ? new Date() : candidate;
}
