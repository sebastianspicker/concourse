/** Caches default relative-time formatters while honoring explicit locale overrides. */
let relativeTimeFormatter: Intl.RelativeTimeFormat | null = null;
let shortRelativeTimeFormatter: Intl.RelativeTimeFormat | null = null;

/** Reuses the default long relative-time formatter but honors an explicit caller locale. */
export function getRelativeTimeFormatter(locale?: string): Intl.RelativeTimeFormat {
  if (locale) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "long" });
  }

  return relativeTimeFormatter ??= new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "long" });
}

/** Reuses the compact formatter used where list rows have limited horizontal space. */
export function getShortRelativeTimeFormatter(locale?: string): Intl.RelativeTimeFormat {
  if (locale) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "short" });
  }

  return shortRelativeTimeFormatter ??= new Intl.RelativeTimeFormat(undefined, { numeric: "always", style: "short" });
}
