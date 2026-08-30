import type { InstitutionPack } from "@concourse/institutions";
import { NoConfiguredSourcesError } from "./errors";
import { applyPagination, applySearch } from "./filters";
import type { RoomsQuery } from "./queries";

export async function getRooms(institution: InstitutionPack, filter: RoomsQuery) {
  const rooms = institution.publicRooms ?? [];
  if (rooms.length === 0) throw new NoConfiguredSourcesError("No rooms configured");

  let filteredRooms = rooms;
  if (filter.campus) filteredRooms = filteredRooms.filter((room) => room.campusId === filter.campus);
  filteredRooms = applySearch(filteredRooms, filter.search, (room) => room.name);
  const _total = filteredRooms.length;
  filteredRooms = applyPagination(filteredRooms, filter.offset ?? 0, filter.limit);
  return { rooms: filteredRooms, _total, _sourcesConfigured: true };
}
