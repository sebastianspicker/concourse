import { useMemo } from "react";
import type { RoomsResponse } from "../api/types";
import { fetchRooms, type RoomsFilterOptions } from "../data/publicApi";
import { usePublicResource, type PublicResource } from "./usePublicResource";

export function useRooms(options?: RoomsFilterOptions): PublicResource<RoomsResponse> {
  const filterKey = useMemo(
    () => JSON.stringify({
      campus: options?.campus, search: options?.search,
      limit: options?.limit, offset: options?.offset
    }),
    [options?.campus, options?.search, options?.limit, options?.offset]
  );

  return usePublicResource<RoomsResponse>(
    (fetchOptions) =>
      fetchRooms({
        force: fetchOptions.force,
        signal: fetchOptions.signal,
        offlineMode: true,
        campus: options?.campus,
        search: options?.search,
        limit: options?.limit,
        offset: options?.offset
      }),
    filterKey
  );
}
