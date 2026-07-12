import { useMemo } from "react";
import type { ScheduleResponse } from "../api/types";
import { fetchSchedule, type ScheduleFilterOptions } from "../data/publicApi";
import { usePublicResource, type PublicResource } from "./usePublicResource";

export function useSchedule(options?: ScheduleFilterOptions): PublicResource<ScheduleResponse> {
  const filterKey = useMemo(
    () => JSON.stringify({
      search: options?.search, from: options?.from, to: options?.to,
      campus: options?.campus, limit: options?.limit, offset: options?.offset
    }),
    [options?.search, options?.from, options?.to, options?.campus, options?.limit, options?.offset]
  );

  return usePublicResource<ScheduleResponse>(
    (fetchOptions) =>
      fetchSchedule({
        force: fetchOptions.force,
        signal: fetchOptions.signal,
        offlineMode: true,
        search: options?.search,
        from: options?.from,
        to: options?.to,
        campus: options?.campus,
        limit: options?.limit,
        offset: options?.offset
      }),
    filterKey
  );
}
