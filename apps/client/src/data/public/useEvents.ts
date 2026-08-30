import type { EventsResponse } from "@concourse/contracts";
import { fetchEvents, type EventsQuery } from "./publicApi";
import { useOfflineResource } from "./useOfflineResource";

export function useEvents(filter: EventsQuery = {}) {
  return useOfflineResource<EventsResponse, EventsQuery>(fetchEvents, filter, JSON.stringify(filter));
}
