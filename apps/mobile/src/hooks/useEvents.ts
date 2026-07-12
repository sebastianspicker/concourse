import { useMemo } from "react";
import type { EventsResponse } from "../api/types";
import { fetchEvents } from "../data/publicApi";
import { usePublicResource, type PublicResource } from "./usePublicResource";

export function useEvents(filter?: {
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
}): PublicResource<EventsResponse> {
  const filterKey = useMemo(
    () => JSON.stringify({ search: filter?.search, from: filter?.from, to: filter?.to, limit: filter?.limit }),
    [filter?.search, filter?.from, filter?.to, filter?.limit]
  );

  return usePublicResource<EventsResponse>(
    (options) =>
      fetchEvents({
        force: options.force,
        signal: options.signal,
        offlineMode: true,
        search: filter?.search,
        from: filter?.from,
        to: filter?.to,
        limit: filter?.limit
      }),
    filterKey
  );
}
