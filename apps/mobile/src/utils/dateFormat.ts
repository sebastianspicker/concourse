/** Formats event and schedule dates using locale-aware, time-zone-aware display rules. */
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

/**
 * Determine the appropriate unit and value for relative time formatting.
 * 
 * @param diffMs - Difference in milliseconds (target - now)
 * @returns Object with unit and rounded value for Intl.RelativeTimeFormat
 */
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

/** Applies the shared relative-time calculation with the requested formatter style. */
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

/**
 * Format a date string for event display.
 * Shows locale-specific date and time.
 * 
 * @param date - ISO date string
 * @param locale - Optional locale override (e.g., "en", "de", "fr")
 * @returns Formatted date string (e.g., "24.02.2026, 14:30")
 */
export function formatEventDate(date: string, locale?: string, timeZone?: string): string {
  return new Date(date).toLocaleString(locale, timeZone ? { timeZone } : undefined);
}

/**
 * Format a time string for schedule display.
 * Shows locale-specific time with consistent 2-digit hour/minute format.
 * 
 * @param date - ISO date string
 * @param locale - Optional locale override (e.g., "en", "de", "fr")
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatScheduleTime(date: string, locale?: string, timeZone?: string): string {
  return new Date(date).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}

/**
 * Format a date for display in headers or labels.
 * Shows locale-specific date with consistent format.
 * 
 * @param date - ISO date string
 * @param locale - Optional locale override (e.g., "en", "de", "fr")
 * @returns Formatted date string (e.g., "24.02.2026")
 */
export function formatDateOnly(date: string, locale?: string): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Format a date with weekday for display.
 * Shows the weekday name followed by the date.
 * 
 * @param date - ISO date string
 * @param locale - Optional locale override (e.g., "en", "de", "fr")
 * @returns Formatted date string with weekday (e.g., "Monday, 24.02.2026")
 */
export function formatDateWithWeekday(date: string, locale?: string): string {
  return new Date(date).toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Format a relative time using Intl.RelativeTimeFormat for locale-aware output.
 * Useful for "today" view and notifications.
 * 
 * @param date - ISO date string
 * @param locale - Optional locale override (e.g., "en", "de", "fr")
 * @returns Relative time string (e.g., "in 2 hours", "yesterday", "now")
 */
export function formatRelativeTime(date: string, locale?: string): string {
  return formatRelativeTimeWith(date, locale, getRelativeTimeFormatter);
}

/**
 * Format a relative time in abbreviated format for compact displays.
 * Uses short style for concise output.
 * 
 * @param date - ISO date string
 * @param locale - Optional locale override (e.g., "en", "de", "fr")
 * @returns Abbreviated relative time string (e.g., "2h ago", "in 3d")
 */
export function formatShortRelativeTime(date: string, locale?: string): string {
  return formatRelativeTimeWith(date, locale, getShortRelativeTimeFormatter);
}

/**
 * Format a campus ID for human-readable display.
 * Replaces hyphens and underscores with spaces and capitalizes each word.
 *
 * @param id - Campus ID string (e.g., "cologne-zzt")
 * @returns Display string (e.g., "Cologne Zzt")
 */
export function formatCampusId(id: string): string {
  if (!id) return "";
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Compares an ISO date with the configured campus calendar day rather than device-local midnight. */
export function isToday(date: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return date.startsWith(today);
}

/**
 * Format a date range for display.
 * 
 * @param start - Start ISO date string
 * @param end - End ISO date string (optional)
 * @param locale - Optional locale override (e.g., "en", "de", "fr")
 * @returns Formatted range string (e.g., "14:30 - 16:00")
 */
export function formatTimeRange(start: string, end?: string, locale?: string, timeZone?: string): string {
  const startTime = formatScheduleTime(start, locale, timeZone);
  if (!end) return startTime;
  const endTime = formatScheduleTime(end, locale, timeZone);
  return `${startTime} - ${endTime}`;
}
