/** Builds room labels, cards, typed detail links, and localized empty states. */
import { formatCampusId } from "@/utils/dateFormat";
import type { Room } from "@concourse/shared";
import type { TranslationKey } from "@/i18n/dictionaries";

/** Encodes a room selection as the typed detail-route state. */
export function getRoomHref(room: Room): {
  pathname: "/rooms/[id]";
  params: { id: string };
} {
  return { pathname: "/rooms/[id]", params: { id: room.id } };
}

/** Shapes room data into a display card and omits an absent campus subtitle. */
export function getRoomCard(room: Room): { title: string; subtitle?: string } {
  return {
    title: room.name,
    subtitle: room.campusId ? formatCampusId(room.campusId) : undefined,
  };
}

/** Produces a concise spoken room summary without exposing visual-only card structure. */
export function getRoomAccessibilityLabel(room: Room, campusLabel: string): string {
  return `${room.name}. ${room.campusId ? `${campusLabel} ${formatCampusId(room.campusId)}.` : ""}`;
}

/** Selects search-specific empty copy when an active filter has no room matches. */
export function getRoomsEmptyMessage(search: string, t: (key: TranslationKey, values?: Record<string, string | number>) => string): string {
  return search ? t("noMatchingRooms", { search }) : t("noRooms");
}

/** Chooses the search or unfiltered room guidance key for the empty state. */
export function getRoomsEmptyHint(search: string, t: (key: TranslationKey) => string): string {
  return t(search ? "searchEmptyHint" : "roomsEmptyHint");
}
