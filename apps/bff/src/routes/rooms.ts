import { RoomsResponseSchema } from "@campus/shared";
import { parseQueryParams, parseRoomsFilter } from "../utils/queryParams";
import { applySearch, applyPagination } from "../utils/filterHelpers";
import { createJsonRoute } from "./createJsonRoute";

export const handleRooms = createJsonRoute(
  async (institution, req) => {
    const rooms = institution.publicRooms ?? [];
    if (rooms.length === 0) {
      throw new Error("NO_CONFIG_SOURCES: No rooms configured");
    }

    const params = parseQueryParams(req);
    const filter = parseRoomsFilter(params);

    let filteredRooms = rooms;
    if (filter.campus) {
      filteredRooms = filteredRooms.filter((r) => r.campusId === filter.campus);
    }
    filteredRooms = applySearch(filteredRooms, filter.search, (r) => r.name);
    const _total = filteredRooms.length;
    filteredRooms = applyPagination(filteredRooms, filter.offset ?? 0, filter.limit);

    return {
      rooms: filteredRooms,
      _total,
      _sourcesConfigured: true
    };
  },
  RoomsResponseSchema,
  { maxAgeSeconds: 300 }
);
