/** Formats campus-local date and clock strings for the Quiet Chronograph Today stage. */
import { de, en } from "@/i18n/dictionaries";

/** Resolves an optional dictionary key, falling back when the key is not yet shipped. */
export function tr(locale: string, key: string, fallback: string): string {
  const dictionary = (locale === "de" ? de : en) as Record<string, string>;
  return dictionary[key] ?? fallback;
}

/** Long weekday date for the muted clock date line (e.g. "Monday, 14 September"). */
export function formatTodayDate(locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(new Date());
}

/** 24h campus-local wall clock for the large tabular time display. */
export function formatCampusTime(locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date());
}
