/** Formats cached-data age for localized offline-status messaging. */
export function formatCacheAge(ms: number, locale = "en"): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "long" });
  if (days > 0) return formatter.format(-days, "day");
  if (hours > 0) return formatter.format(-hours, "hour");
  if (minutes > 0) return formatter.format(-minutes, "minute");
  return formatter.format(0, "second");
}
