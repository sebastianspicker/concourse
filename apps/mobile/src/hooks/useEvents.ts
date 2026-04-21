import { useMemo } from "react";
import type { EventsResponse } from "../api/types";
import { fetchEvents } from "../data/publicApi";
import { usePublicResource } from "./usePublicResource";

export function useEvents(filter?: {
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
}): {
  data: EventsResponse | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
} {
  const filterKey = useMemo(
    () => JSON.stringify({ search: filter?.search, from: filter?.from, to: filter?.to, limit: filter?.limit }),
    [filter?.search, filter?.from, filter?.to, filter?.limit]
  );

  return usePublicResource<EventsResponse>(
    (options) =>
      fetchEvents({
        force: options.force,
        signal: options.signal,
        search: filter?.search,
        from: filter?.from,
        to: filter?.to,
        limit: filter?.limit
      }),
    filterKey
  );
}
