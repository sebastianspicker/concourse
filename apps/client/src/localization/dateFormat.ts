let relativeTimeFormatter: Intl.RelativeTimeFormat | null = null;

function getRelativeTimeFormatter(locale?: string): Intl.RelativeTimeFormat {
  if (locale) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "long" });
  }

  return relativeTimeFormatter ??= new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "long" });
}

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

const RELATIVE_TIME_THRESHOLDS: Array<{
  thresholdMs: number;
  unitMs: number;
  unit: Intl.RelativeTimeFormatUnit;
  fallbackUnit: Intl.RelativeTimeFormatUnit;
  fallbackUnitMs: number;
}> = [
  { thresholdMs: HOUR_MS, unitMs: MINUTE_MS, unit: "minute", fallbackUnit: "second", fallbackUnitMs: SECOND_MS },
  { thresholdMs: DAY_MS, unitMs: HOUR_MS, unit: "hour", fallbackUnit: "minute", fallbackUnitMs: MINUTE_MS },
  { thresholdMs: WEEK_MS, unitMs: DAY_MS, unit: "day", fallbackUnit: "hour", fallbackUnitMs: HOUR_MS },
  { thresholdMs: MONTH_MS, unitMs: WEEK_MS, unit: "week", fallbackUnit: "day", fallbackUnitMs: DAY_MS },
  { thresholdMs: YEAR_MS, unitMs: MONTH_MS, unit: "month", fallbackUnit: "week", fallbackUnitMs: WEEK_MS },
];

function getRelativeTimeUnit(diffMs: number): { unit: Intl.RelativeTimeFormatUnit; value: number } {
  const absMs = Math.abs(diffMs);

  const sign = diffMs < 0 ? -1 : 1;

  if (absMs < MINUTE_MS) {
    return { unit: "second", value: Math.round(diffMs / SECOND_MS) };
  }

  const threshold = RELATIVE_TIME_THRESHOLDS.find(({ thresholdMs }) => absMs < thresholdMs);
  if (!threshold) return { unit: "year", value: Math.round(diffMs / YEAR_MS) };

  const rounded = Math.round(diffMs / threshold.unitMs);
  if (rounded !== 0) return { unit: threshold.unit, value: rounded };

  return {
    unit: threshold.fallbackUnit,
    value: sign * Math.max(1, Math.round(absMs / threshold.fallbackUnitMs)),
  };
}

export function formatRelativeTime(date: string, locale?: string): string {
  const diffMs = new Date(date).getTime() - Date.now();
  const formatter = getRelativeTimeFormatter(locale);
  if (Math.abs(diffMs) < MINUTE_MS) return formatter.format(0, "second");

  const { unit, value } = getRelativeTimeUnit(diffMs);
  return formatter.format(value, unit);
}

export function formatEventDate(date: string, locale?: string, timeZone?: string): string {
  return new Date(date).toLocaleString(locale, timeZone ? { timeZone } : undefined);
}

export function formatScheduleTime(date: string, locale?: string, timeZone?: string): string {
  return new Date(date).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}

export function formatCampusId(id: string): string {
  if (!id) return "";
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatTimeRange(start: string, end?: string, locale?: string, timeZone?: string): string {
  const startTime = formatScheduleTime(start, locale, timeZone);
  if (!end) return startTime;
  const endTime = formatScheduleTime(end, locale, timeZone);
  return `${startTime} - ${endTime}`;
}

function resolveBoardLocale(locale?: string): string {
  return locale?.startsWith("de") ? "de-DE" : "en-GB";
}

const boardFormatters = new Map<string, Intl.DateTimeFormat>();

function getBoardFormatter(kind: string, locale: string | undefined, timeZone: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const resolvedLocale = resolveBoardLocale(locale);
  const key = `${kind}:${resolvedLocale}:${timeZone ?? ""}`;
  const cached = boardFormatters.get(key);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat(resolvedLocale, { ...options, timeZone });
  boardFormatters.set(key, formatter);
  return formatter;
}

/** Campus board time: always 24-hour "HH:mm", the convention of the campus, not the device. */
export function formatBoardTime(date: string, locale?: string, timeZone?: string): string {
  return getBoardFormatter("time", locale, timeZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(date));
}

/** Weekday, day, and month parts for a board date cell, e.g. { weekday: "Wed", day: "16", month: "Sept" } (en-GB). */
export function formatBoardDay(date: string, locale?: string, timeZone?: string): { weekday: string; day: string; month: string } {
  const parts = getBoardFormatter("day", locale, timeZone, { weekday: "short", day: "numeric", month: "short" }).formatToParts(new Date(date));
  const part = (type: Intl.DateTimeFormatPartTypes) => (parts.find((entry) => entry.type === type)?.value ?? "").replace(/\.$/, "");
  return { weekday: part("weekday"), day: part("day"), month: part("month") };
}

/** Stable campus-day key (YYYY-MM-DD in the campus zone) for grouping board rows by day. */
export function getCampusDayKey(date: string, timeZone?: string): string {
  const key = `daykey:${timeZone ?? ""}`;
  let formatter = boardFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone });
    boardFormatters.set(key, formatter);
  }
  return formatter.format(new Date(date));
}

/** Long date for headings and detail facts, e.g. "Wednesday, 16 September 2026". */
export function formatLongDate(date: string, locale?: string, timeZone?: string): string {
  return getBoardFormatter("long", locale, timeZone, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
}

/** Compact date and time for detail subtitles, e.g. "Wed 16 Sep · 19:30". */
export function formatBoardDateTime(date: string, locale?: string, timeZone?: string): string {
  const { weekday, day, month } = formatBoardDay(date, locale, timeZone);
  return `${weekday} ${day} ${month} · ${formatBoardTime(date, locale, timeZone)}`;
}

/** Board time span, e.g. "10:00 - 11:30"; start only when the end is unknown. */
export function formatBoardTimeRange(start: string, end?: string, locale?: string, timeZone?: string): string {
  const startTime = formatBoardTime(start, locale, timeZone);
  return end ? `${startTime} - ${formatBoardTime(end, locale, timeZone)}` : startTime;
}

/** Host of a public source URL without a leading "www.", for row-level provenance. */
export function formatSourceHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Ids of the rows that open a new campus day, so repeated day cells can be left blank ("ditto"). */
export function getFirstOfDayIds<T>(items: T[], getId: (item: T) => string, getDate: (item: T) => string, timeZone?: string): Set<string> {
  const firsts = new Set<string>();
  let previousDay: string | undefined;
  for (const item of items) {
    const day = getCampusDayKey(getDate(item), timeZone);
    if (day !== previousDay) firsts.add(getId(item));
    previousDay = day;
  }
  return firsts;
}
