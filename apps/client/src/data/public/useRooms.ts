import type { RoomsResponse } from "@concourse/contracts";
import { fetchRooms, type RoomsQuery } from "./publicApi";
import { useOfflineResource } from "./useOfflineResource";

export function useRooms(options: RoomsQuery = {}) {
  return useOfflineResource<RoomsResponse, RoomsQuery>(fetchRooms, options, JSON.stringify(options));
}
