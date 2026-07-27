/** Exposes filtered event data through the shared offline-aware resource lifecycle. */
import type { EventsResponse } from "../api/types";
import { fetchEvents, type EventsQuery } from "../data/publicApi";
import { useOfflineResource } from "./useOfflineResource";

/** Loads filtered events through the shared abortable offline-resource lifecycle. */
export function useEvents(filter: EventsQuery = {}) {
  return useOfflineResource<EventsResponse, EventsQuery>(fetchEvents, filter, JSON.stringify(filter));
}
