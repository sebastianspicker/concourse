import { formatCampusId } from "../utils/dateFormat";
import { serializeRouteItem } from "../utils/routeItem";
import type { Room } from "@campus/shared";

export function getRoomHref(room: Room): {
  pathname: "/rooms/[id]";
  params: { id: string; item: string };
} {
  return { pathname: "/rooms/[id]", params: { id: room.id, item: serializeRouteItem(room) } };
}

export function getRoomCard(room: Room): { title: string; subtitle?: string } {
  return {
    title: room.name,
    subtitle: room.campusId ? formatCampusId(room.campusId) : undefined,
  };
}

export function getRoomAccessibilityLabel(room: Room): string {
  return `${room.name}. ${room.campusId ? `Campus ${room.campusId}.` : ""}`;
}

export function getRoomsEmptyMessage(search: string): string {
  return search ? `No rooms matching "${search}"` : "No rooms available yet.";
}

export function getRoomsEmptyHint(search: string): string {
  return search
    ? "Try a different search term or clear your search."
    : "Room data is loaded from the institution config.";
}
