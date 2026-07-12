import { formatEventDate, formatRelativeTime, formatScheduleTime, formatTimeRange } from "@/utils/dateFormat";
import { serializeRouteItem } from "@/utils/routeItem";
import type { PublicEvent, ScheduleItem } from "@campus/shared";
import type { UiError } from "@/api/uiError";

export type SortDirection = "asc" | "desc";

export function getLocalDayRange(): { from: string; to: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return {
    from: start.toISOString(),
    to: end.toISOString()
  };
}

export function isScheduleUnavailable(error: UiError | null): boolean {
  return error?.kind === "unavailableSource" || error?.kind === "notFound";
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function sortScheduleItems(items: ScheduleItem[], direction: SortDirection): ScheduleItem[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.startsAt).getTime();
    const dateB = new Date(b.startsAt).getTime();
    return direction === "asc" ? dateA - dateB : dateB - dateA;
  });
}

export function getEventCard(event: PublicEvent): { title: string; subtitle: string } {
  return {
    title: event.title,
    subtitle: `${formatEventDate(event.date)} · ${formatRelativeTime(event.date)}`
  };
}

export function getEventAccessibilityLabel(event: PublicEvent): string {
  return `${event.title}. ${formatEventDate(event.date)}. ${formatRelativeTime(event.date)}.`;
}

export function getEventHref(event: PublicEvent): { pathname: "/events/[id]"; params: { id: string } } {
  return { pathname: "/events/[id]", params: { id: event.id } };
}

export function getScheduleCard(item: ScheduleItem): { title: string; subtitle: string } {
  return {
    title: item.title,
    subtitle: `${formatTimeRange(item.startsAt, item.endsAt)} · ${item.location ?? "TBA"}`
  };
}

export function getScheduleAccessibilityLabel(item: ScheduleItem): string {
  return `${item.title}. ${formatScheduleTime(item.startsAt)}. Location: ${item.location ?? "TBA"}.`;
}

export function getScheduleHref(item: ScheduleItem): {
  pathname: "/schedule/[id]";
  params: { id: string; item: string };
} {
  return { pathname: "/schedule/[id]", params: { id: item.id, item: serializeRouteItem(item) } };
}
