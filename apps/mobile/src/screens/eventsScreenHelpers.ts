/** Builds event labels, cards, typed detail links, and localized empty states. */
import { formatEventDate } from "@/utils/dateFormat";
import type { PublicEvent } from "@concourse/shared";
import type { TranslationKey } from "@/i18n/dictionaries";

export type SortDirection = "asc" | "desc";

/** Sorts a copied event array by timestamp so callers never mutate cached response data. */
export function sortEventsByDate(events: PublicEvent[], direction: SortDirection): PublicEvent[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return direction === "asc" ? dateA - dateB : dateB - dateA;
  });
}

/** Encodes a list selection as Expo Router state for the event-detail route. */
export function getEventHref(event: PublicEvent): { pathname: "/events/[id]"; params: { id: string } } {
  return { pathname: "/events/[id]", params: { id: event.id } };
}

/** Shapes an event into localized title and date text for a resource row. */
export function getEventCard(event: PublicEvent, locale: string, timeZone: string): { title: string; subtitle: string } {
  return {
    title: event.title,
    subtitle: formatEventDate(event.date, locale, timeZone)
  };
}

/** Produces the spoken event summary for accessible result-list navigation. */
export function getEventAccessibilityLabel(event: PublicEvent, locale: string, timeZone: string): string {
  return `${event.title}. ${formatEventDate(event.date, locale, timeZone)}.`;
}

/** Selects search-specific empty copy when an active filter has no event matches. */
export function getEventsEmptyMessage(search: string, t: (key: TranslationKey, values?: Record<string, string | number>) => string): string {
  return search ? t("noMatchingEvents", { search }) : t("noEvents");
}

/** Selects the matching search or unfiltered empty-state guidance key. */
export function getEventsEmptyHint(search: string, t: (key: TranslationKey) => string): string {
  return t(search ? "searchEmptyHint" : "eventsEmptyHint");
}
