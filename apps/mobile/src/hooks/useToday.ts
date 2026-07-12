import type { TodayResponse } from "../api/types";
import { fetchToday } from "../data/publicApi";
import { usePublicResource, type PublicResource } from "./usePublicResource";

function getLocalDateParam(date = new Date()): string {
  // `/today` is campus-day scoped. Send the device's local YYYY-MM-DD so a
  // late-night mobile client does not inherit the BFF host's UTC date boundary.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useToday(): PublicResource<TodayResponse> {
  return usePublicResource<TodayResponse>((options) =>
    fetchToday({
      force: options.force,
      signal: options.signal,
      offlineMode: true,
      date: getLocalDateParam()
    })
  );
}
