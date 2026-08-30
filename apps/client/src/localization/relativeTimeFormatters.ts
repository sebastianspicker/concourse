let relativeTimeFormatter: Intl.RelativeTimeFormat | null = null;
let shortRelativeTimeFormatter: Intl.RelativeTimeFormat | null = null;

export function getRelativeTimeFormatter(locale?: string): Intl.RelativeTimeFormat {
  if (locale) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "long" });
  }

  return relativeTimeFormatter ??= new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "long" });
}

export function getShortRelativeTimeFormatter(locale?: string): Intl.RelativeTimeFormat {
  if (locale) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "short" });
  }

  return shortRelativeTimeFormatter ??= new Intl.RelativeTimeFormat(undefined, { numeric: "always", style: "short" });
}
