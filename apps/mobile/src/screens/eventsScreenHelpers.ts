import { formatEventDate } from "@/utils/dateFormat";
import type { PublicEvent } from "@campus/shared";

export type SortDirection = "asc" | "desc";

export function sortEventsByDate(events: PublicEvent[], direction: SortDirection): PublicEvent[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return direction === "asc" ? dateA - dateB : dateB - dateA;
  });
}

export function getEventHref(event: PublicEvent): { pathname: "/events/[id]"; params: { id: string } } {
  return { pathname: "/events/[id]", params: { id: event.id } };
}

export function getEventCard(event: PublicEvent): { title: string; subtitle: string } {
  return {
    title: event.title,
    subtitle: formatEventDate(event.date)
  };
}

export function getEventAccessibilityLabel(event: PublicEvent): string {
  return `${event.title}. ${formatEventDate(event.date)}.`;
}

export function getEventsEmptyMessage(search: string): string {
  return search ? `No events matching "${search}"` : "No public events yet.";
}

export function getEventsEmptyHint(search: string): string {
  return search
    ? "Try a different search term or clear your search."
    : "Pull down to refresh -- new events appear as they are published.";
}
