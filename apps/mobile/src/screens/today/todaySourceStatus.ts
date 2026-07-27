/** Derives public-source status labels and chrome freshness tones for Today. */
import type { useLocale } from "@/i18n/LocaleContext";
import type { useTheme } from "@/ui/ThemeContext";
import { tr } from "./todayClockFormat";

export type TodaySourceTone = "success" | "warning" | "error" | "muted";

export type TodaySourceStatus = {
  label: string;
  color: string;
  tone: TodaySourceTone;
};

export type TodayChromeStatus = {
  label: string;
  tone: TodaySourceTone;
  color: string;
};

type ThemeColors = ReturnType<typeof useTheme>["colors"];
type Translate = ReturnType<typeof useLocale>["t"];

/** Maps public today/schedule resource state into a short status line for the Now panel. */
export function getTodaySourceStatus({
  cached,
  degraded,
  loading,
  unavailable,
  theme,
  t,
  locale = "en",
}: {
  cached: boolean;
  degraded: boolean;
  loading: boolean;
  unavailable: boolean;
  theme: ReturnType<typeof useTheme>;
  t: Translate;
  locale?: string;
}): TodaySourceStatus {
  if (unavailable) {
    return { label: t("publicSourcesUnavailable"), color: theme.colors.error, tone: "error" };
  }
  if (degraded) {
    return { label: t("publicSourcesLimited"), color: theme.colors.warning, tone: "warning" };
  }
  if (cached) {
    return { label: t("publicSourcesCached"), color: theme.colors.warning, tone: "warning" };
  }
  if (loading) {
    return { label: t("publicSourcesChecking"), color: theme.colors.muted, tone: "muted" };
  }
  return {
    label: tr(locale, "publicSourcesAreCurrent", t("publicSourcesCurrent")),
    color: theme.colors.success,
    tone: "success",
  };
}

/** Builds a short chrome/freshness chip label matching Quiet Chronograph live status. */
export function getTodayChromeStatus(
  sourceStatus: TodaySourceStatus,
  locale: string,
  colors: ThemeColors,
  isCompact: boolean,
): TodayChromeStatus {
  if (sourceStatus.tone === "success") {
    return {
      tone: "success",
      color: colors.success,
      label: isCompact
        ? tr(locale, "liveStatus", "Live")
        : tr(locale, "updatedJustNow", "Updated just now"),
    };
  }
  return {
    tone: sourceStatus.tone,
    color: sourceStatus.color,
    label: sourceStatus.label,
  };
}
