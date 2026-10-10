/** Provides time-zone-aware rows, now/next selection, and typed links for the Today screen. */
import {
  formatBoardDay,
  formatBoardTime,
  formatBoardTimeRange,
  formatEventDate,
  formatRelativeTime,
  formatSourceHost,
} from "@/localization/dateFormat";
import type { PublicEvent, ScheduleItem, ScheduleResponse } from "@concourse/contracts";
import type { ResourceListContent, RowStatus } from "@/design-system/ResourceListItem";
import type { SortDirection } from "@/design-system/SortButton";
import type { UiError } from "@/platform/http/uiError";
import { getCampusDayRange } from "@/platform/time/campusTime";

/** Converts the current instant into inclusive campus-day query bounds. */
export function getLocalDayRange(date: Date, timeZone: string): { from: string; to: string } {
  return getCampusDayRange(date, timeZone);
}

/** Identifies unavailable schedule data so Today can avoid implying that an empty list is current. */
export function isScheduleUnavailable(error: UiError | null): boolean {
  return error?.kind === "unavailableSource" || error?.kind === "notFound";
}

/** Sorts a copied schedule list by start time in the requested direction. */
export function sortScheduleItems(items: ScheduleItem[], direction: SortDirection): ScheduleItem[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.startsAt).getTime();
    const dateB = new Date(b.startsAt).getTime();
    return direction === "asc" ? dateA - dateB : dateB - dateA;
  });
}

/** Shapes an upcoming event into a board row: day cell, time and source, and relative time aside. */
export function getEventCard(
  event: PublicEvent,
  locale: string,
  timeZone: string,
  showDay = true,
): ResourceListContent {
  const host = formatSourceHost(event.sourceUrl);
  const { weekday, day } = formatBoardDay(event.date, locale, timeZone);
  return {
    title: event.title,
    subtitle: [formatBoardTime(event.date, locale, timeZone), host].filter(Boolean).join(" · "),
    subtitleIsData: true,
    day: showDay ? { weekday, day } : null,
    aside: formatRelativeTime(event.date, locale),
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

function findNextScheduleItem<T extends TimestampedScheduleItem>(items: T[], nowMs: number): T | undefined {
  let next: T | undefined;
  for (const item of items) {
    if (item.startsAtMs > nowMs && (!next || item.startsAtMs < next.startsAtMs)) next = item;
  }
  return next;
}

/** Prefers the ongoing schedule item, otherwise returns the nearest future item. */
export function getCurrentOrNextScheduleId(items: ScheduleItem[], now = new Date()): string | undefined {
  const { current, next } = getNowAndNext(items, now);
  return (current ?? next)?.id;
}

/**
 * Selects what the board shows: the entry in progress (if any) and the nearest entry that has not
 * started yet. Selection is independent of the list's sort order.
 */
export function getNowAndNext(items: ScheduleItem[], now = new Date()): { current?: ScheduleItem; next?: ScheduleItem } {
  const nowMs = now.getTime();
  const timestamped = items.map(getScheduleItemTimestamps);
  const current = timestamped
    .filter((item) => isCurrentScheduleItem(item, nowMs))
    .sort((a, b) => a.startsAtMs - b.startsAtMs)[0];
  const next = findNextScheduleItem(timestamped, nowMs);
  const original = (match?: TimestampedScheduleItem) => (match ? items.find((item) => item.id === match.id) : undefined);
  return { current: original(current), next: original(next) };
}

export type ScheduleEntryState = "now" | "next" | "ended" | "later";

/** Classifies one entry for the board's status column. Entries without an end are never "ended". */
export function getScheduleEntryState(
  item: ScheduleItem,
  selection: { current?: ScheduleItem; next?: ScheduleItem },
  now = new Date(),
): ScheduleEntryState {
  const timestamped = getScheduleItemTimestamps(item);
  // Parallel entries can run at once: every entry in progress is "now", not only the board's one.
  if (selection.current?.id === item.id || isCurrentScheduleItem(timestamped, now.getTime())) return "now";
  if (selection.next?.id === item.id) return "next";
  if (Number.isFinite(timestamped.endsAtMs) && timestamped.endsAtMs <= now.getTime()) return "ended";
  return "later";
}

export type ScheduleStatusLabels = { now: string; next: string; ended: string };

function toRowStatus(state: ScheduleEntryState, labels: ScheduleStatusLabels): RowStatus | undefined {
  return state === "later" ? undefined : { kind: state, label: labels[state] };
}

/** Shapes a schedule item into a board row: time column, title and place, and status cell. */
export function getScheduleCard(
  item: ScheduleItem,
  locale: string,
  timeZone: string,
  toBeAnnounced: string,
  state: ScheduleEntryState = "later",
  labels?: ScheduleStatusLabels,
): ResourceListContent {
  return {
    title: item.title,
    subtitle: item.location ?? toBeAnnounced,
    leading: formatBoardTime(item.startsAt, locale, timeZone),
    leadingDetail: item.endsAt ? formatBoardTime(item.endsAt, locale, timeZone) : undefined,
    status: labels ? toRowStatus(state, labels) : undefined,
    dimmed: state === "ended",
  };
}

/** Builds spoken schedule context from the course, room, time span, and board status. */
export function getScheduleAccessibilityLabel(
  item: ScheduleItem,
  locale: string,
  timeZone: string,
  location: string,
  toBeAnnounced: string,
  statusLabel?: string,
): string {
  const time = formatBoardTimeRange(item.startsAt, item.endsAt, locale, timeZone);
  const status = statusLabel ? ` ${statusLabel}.` : "";
  return `${item.title}. ${time}. ${location}: ${item.location ?? toBeAnnounced}.${status}`;
}

/** Returns the typed detail-route state required to preserve a selected schedule item. */
export function getScheduleHref(item: ScheduleItem): {
  pathname: "/schedule/[id]";
  params: { id: string };
} {
  return { pathname: "/schedule/[id]", params: { id: item.id } };
}

export const TODAY_SCHEDULE_LIMIT = 50;

export type TodayScheduleSlice = {
  items: ScheduleItem[];
  total: number;
};

/** Sorts the day's schedule and caps it at the display limit while keeping the public total. */
export function getTodaySchedule(
  data: ScheduleResponse | null,
  direction: SortDirection,
): TodayScheduleSlice {
  const items = sortScheduleItems(data?.schedule ?? [], direction);
  return {
    items: items.slice(0, TODAY_SCHEDULE_LIMIT),
    total: data?._total ?? items.length,
  };
}
