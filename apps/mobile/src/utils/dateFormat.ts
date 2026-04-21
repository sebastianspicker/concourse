// Cache the relative time formatters for the default locale only
let relativeTimeFormatter: Intl.RelativeTimeFormat | null = null;
let shortRelativeTimeFormatter: Intl.RelativeTimeFormat | null = null;

function getRelativeTimeFormatter(locale?: string): Intl.RelativeTimeFormat {
  if (locale) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "long" });
  }
  return relativeTimeFormatter ??= new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "long" });
}

function getShortRelativeTimeFormatter(locale?: string): Intl.RelativeTimeFormat {
  if (locale) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "short" });
  }
  return shortRelativeTimeFormatter ??= new Intl.RelativeTimeFormat(undefined, { numeric: "always", style: "short" });
}

/**
 * Determine the appropriate unit and value for relative time formatting.
 * 
 * @param diffMs - Difference in milliseconds (target - now)
 * @returns Object with unit and rounded value for Intl.RelativeTimeFormat
 */
function getRelativeTimeUnit(diffMs: number): { unit: Intl.RelativeTimeFormatUnit; value: number } {
  const absMs = Math.abs(diffMs);
  
  // Define thresholds in milliseconds
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;
  
  const sign = diffMs < 0 ? -1 : 1;

  if (absMs < MINUTE) {
    return { unit: "second", value: Math.round(diffMs / 1000) };
  }
  if (absMs < HOUR) {
    const rounded = Math.round(diffMs / MINUTE);
    // If rounding to 0, fall back to the smaller unit (seconds)
    if (rounded === 0) return { unit: "second", value: sign * Math.max(1, Math.round(absMs / 1000)) };
    return { unit: "minute", value: rounded };
  }
  if (absMs < DAY) {
    const rounded = Math.round(diffMs / HOUR);
    if (rounded === 0) return { unit: "minute", value: sign * Math.max(1, Math.round(absMs / MINUTE)) };
    return { unit: "hour", value: rounded };
  }
  if (absMs < WEEK) {
    const rounded = Math.round(diffMs / DAY);
    if (rounded === 0) return { unit: "hour", value: sign * Math.max(1, Math.round(absMs / HOUR)) };
    return { unit: "day", value: rounded };
  }
  if (absMs < MONTH) {
    const rounded = Math.round(diffMs / WEEK);
    if (rounded === 0) return { unit: "day", value: sign * Math.max(1, Math.round(absMs / DAY)) };
    return { unit: "week", value: rounded };
  }
  if (absMs < YEAR) {
    const rounded = Math.round(diffMs / MONTH);
    if (rounded === 0) return { unit: "week", value: sign * Math.max(1, Math.round(absMs / WEEK)) };
    return { unit: "month", value: rounded };
  }
  return { unit: "year", value: Math.round(diffMs / YEAR) };
}

/**
 * Format a date string for event display.
 * Shows locale-specific date and time.
 * 
 * @param date - ISO date string
 * @param locale - Optional locale override (e.g., "en", "de", "fr")
 * @returns Formatted date string (e.g., "24.02.2026, 14:30")
 */
export function formatEventDate(date: string, locale?: string): string {
  return new Date(date).toLocaleString(locale);
}

/**
 * Format a time string for schedule display.
 * Shows locale-specific time with consistent 2-digit hour/minute format.
 * 
 * @param date - ISO date string
 * @param locale - Optional locale override (e.g., "en", "de", "fr")
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatScheduleTime(date: string, locale?: string): string {
  return new Date(date).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
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
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  
  // Handle "now" case (within 60 seconds)
  if (Math.abs(diffMs) < 60000) {
    return "now";
  }
  
  const { unit, value } = getRelativeTimeUnit(diffMs);
  const formatter = getRelativeTimeFormatter(locale);
  
  return formatter.format(value, unit);
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
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  
  // Handle "now" case (within 60 seconds)
  if (Math.abs(diffMs) < 60000) {
    return "now";
  }
  
  const { unit, value } = getRelativeTimeUnit(diffMs);
  const formatter = getShortRelativeTimeFormatter(locale);
  
  return formatter.format(value, unit);
}

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
export function formatTimeRange(start: string, end?: string, locale?: string): string {
  const startTime = formatScheduleTime(start, locale);
  if (!end) return startTime;
  const endTime = formatScheduleTime(end, locale);
  return `${startTime} - ${endTime}`;
}
