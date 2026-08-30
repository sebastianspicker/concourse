import { getRelativeTimeFormatter, getShortRelativeTimeFormatter } from "./relativeTimeFormatters";

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

type RelativeTimeFormatterFactory = (locale?: string) => Intl.RelativeTimeFormat;

function formatRelativeTimeWith(
  date: string,
  locale: string | undefined,
  formatterFactory: RelativeTimeFormatterFactory,
): string {
  const diffMs = new Date(date).getTime() - Date.now();
  const formatter = formatterFactory(locale);
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

export function formatDateOnly(date: string, locale?: string): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateWithWeekday(date: string, locale?: string): string {
  return new Date(date).toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatRelativeTime(date: string, locale?: string): string {
  return formatRelativeTimeWith(date, locale, getRelativeTimeFormatter);
}

export function formatShortRelativeTime(date: string, locale?: string): string {
  return formatRelativeTimeWith(date, locale, getShortRelativeTimeFormatter);
}

export function formatCampusId(id: string): string {
  if (!id) return "";
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isToday(date: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return date.startsWith(today);
}

export function formatTimeRange(start: string, end?: string, locale?: string, timeZone?: string): string {
  const startTime = formatScheduleTime(start, locale, timeZone);
  if (!end) return startTime;
  const endTime = formatScheduleTime(end, locale, timeZone);
  return `${startTime} - ${endTime}`;
}
