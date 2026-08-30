/** Provides time-zone-aware cards, freshness selection, and typed links for the Today screen. */
import { formatEventDate, formatRelativeTime, formatScheduleTime, formatTimeRange } from "@/localization/dateFormat";
import type { PublicEvent, ScheduleItem } from "@concourse/contracts";
import type { UiError } from "@/platform/http/uiError";
import { getCampusDayRange } from "@/platform/time/campusTime";

export type SortDirection = "asc" | "desc";

/** Converts the current instant into inclusive campus-day query bounds. */
export function getLocalDayRange(date: Date, timeZone: string): { from: string; to: string } {
  return getCampusDayRange(date, timeZone);
}

/** Identifies unavailable schedule data so Today can avoid implying that an empty list is current. */
export function isScheduleUnavailable(error: UiError | null): boolean {
  return error?.kind === "unavailableSource" || error?.kind === "notFound";
}

type FreshnessResource = { source: "network" | "memory-cache" | "persisted-cache" | null; updatedAt: number | null };

/** Chooses the least misleading timestamp when schedule data is unavailable or independently stale. */
export function getTodayFreshnessUpdatedAt(today: FreshnessResource, schedule: FreshnessResource, scheduleUnavailable: boolean): number | null {
  if (today.source !== "network" || (!scheduleUnavailable && schedule.source !== "network")) return null;
  const timestamps = [today.updatedAt, scheduleUnavailable ? null : schedule.updatedAt]
    .filter((value): value is number => typeof value === "number");
  return timestamps.length > 0 ? Math.min(...timestamps) : null;
}

/** Selects the localized greeting key from the campus-local hour. */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Formats the heading date in the active locale and institution time zone. */
export function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Sorts a copied schedule list by start time in the requested direction. */
export function sortScheduleItems(items: ScheduleItem[], direction: SortDirection): ScheduleItem[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.startsAt).getTime();
    const dateB = new Date(b.startsAt).getTime();
    return direction === "asc" ? dateA - dateB : dateB - dateA;
  });
}

/** Shapes a today event into localized card text for the compact list. */
export function getEventCard(event: PublicEvent, locale: string, timeZone: string): { title: string; subtitle: string } {
  return {
    title: event.title,
    subtitle: `${formatEventDate(event.date, locale, timeZone)} · ${formatRelativeTime(event.date, locale)}`
  };
}

/** Produces the spoken event summary used by screen-reader list navigation. */
export function getEventAccessibilityLabel(event: PublicEvent, locale: string, timeZone: string): string {
  return `${event.title}. ${formatEventDate(event.date, locale, timeZone)}. ${formatRelativeTime(event.date, locale)}.`;
}

/** Encodes compact Today selections for the event-detail route without importing the Events feature. */
export function getEventHref(event: PublicEvent): { pathname: "/events/[id]"; params: { id: string } } {
  return { pathname: "/events/[id]", params: { id: event.id } };
}

/** Shapes a schedule item into localized time and course display text. */
export function getScheduleCard(item: ScheduleItem, locale: string, timeZone: string, toBeAnnounced: string): { title: string; subtitle: string; leading: string } {
  return {
    title: item.title,
    subtitle: item.location ?? toBeAnnounced,
    leading: formatTimeRange(item.startsAt, item.endsAt, locale, timeZone),
  };
}

type TimestampedScheduleItem = ScheduleItem & { startsAtMs: number; endsAtMs: number };

function getScheduleItemTimestamps(item: ScheduleItem): TimestampedScheduleItem {
  return {
    ...item,
    startsAtMs: Date.parse(item.startsAt),
    endsAtMs: item.endsAt ? Date.parse(item.endsAt) : Number.NaN,
  };
}

function isCurrentScheduleItem(item: TimestampedScheduleItem, nowMs: number): boolean {
  return Number.isFinite(item.startsAtMs)
    && Number.isFinite(item.endsAtMs)
    && item.startsAtMs <= nowMs
    && nowMs < item.endsAtMs;
}

function getNextScheduleItemId(items: TimestampedScheduleItem[], nowMs: number): string | undefined {
  let next: TimestampedScheduleItem | undefined;
  for (const item of items) {
    if (item.startsAtMs > nowMs && (!next || item.startsAtMs < next.startsAtMs)) next = item;
  }
  return next?.id;
}

/** Prefers the ongoing schedule item, otherwise returns the nearest future item. */
export function getCurrentOrNextScheduleId(items: ScheduleItem[], now = new Date()): string | undefined {
  const nowMs = now.getTime();
  const timestampedItems = items.map(getScheduleItemTimestamps);
  const current = timestampedItems.find((item) => isCurrentScheduleItem(item, nowMs));
  if (current) return current.id;
  return getNextScheduleItemId(timestampedItems, nowMs);
}

/** Builds spoken schedule context from the course, room, and localized time. */
export function getScheduleAccessibilityLabel(item: ScheduleItem, locale: string, timeZone: string, location: string, toBeAnnounced: string): string {
  return `${item.title}. ${formatScheduleTime(item.startsAt, locale, timeZone)}. ${location}: ${item.location ?? toBeAnnounced}.`;
}

/** Returns the typed detail-route state required to preserve a selected schedule item. */
export function getScheduleHref(item: ScheduleItem): {
  pathname: "/schedule/[id]";
  params: { id: string };
} {
  return { pathname: "/schedule/[id]", params: { id: item.id } };
}
