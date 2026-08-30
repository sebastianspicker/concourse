import { de, en } from "@/localization/dictionaries";

/** Resolves an optional dictionary key, falling back when the key is not yet shipped. */
export function tr(locale: string, key: string, fallback: string): string {
  const dictionary = (locale === "de" ? de : en) as Record<string, string>;
  return dictionary[key] ?? fallback;
}

export function formatTodayDate(locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(new Date());
}

export function formatCampusTime(locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date());
}
