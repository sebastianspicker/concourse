/** Exposes filtered room data through the shared offline-aware resource lifecycle. */
import type { RoomsResponse } from "../api/types";
import { fetchRooms, type RoomsQuery } from "../data/publicApi";
import { useOfflineResource } from "./useOfflineResource";

/** Loads filtered rooms through the shared abortable offline-resource lifecycle. */
export function useRooms(options: RoomsQuery = {}) {
  return useOfflineResource<RoomsResponse, RoomsQuery>(fetchRooms, options, JSON.stringify(options));
}
