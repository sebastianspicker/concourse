import type { TodayResponse } from "../api/types";
import { fetchToday } from "../data/publicApi";
import { usePublicResource } from "./usePublicResource";

export function useToday(): {
  data: TodayResponse | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
} {
  return usePublicResource<TodayResponse>((options) =>
    fetchToday({ force: options.force, signal: options.signal })
  );
}
