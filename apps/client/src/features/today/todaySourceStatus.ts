/** Pure Today presentation helpers: source status, header status, board copy, and campus clock text. */
import type { ScheduleItem } from "@concourse/contracts";
import type { useLocale } from "@/localization/LocaleContext";
import type { Theme } from "@/design-system/ThemeProvider";
import type { LampShape } from "@/design-system/StatusLamp";
import { formatBoardTime, formatBoardTimeRange } from "@/localization/dateFormat";

export type TodaySourceTone = "success" | "warning" | "error" | "muted";

export type TodaySourceStatus = {
  label: string;
  color: string;
  tone: TodaySourceTone;
  lamp: LampShape;
};

export type TodayChromeStatus = {
  label: string;
  tone: TodaySourceTone;
  color: string;
  lamp: LampShape;
};

type Translate = ReturnType<typeof useLocale>["t"];

export function getTodaySourceStatus({
  cached,
  degraded,
  loading,
  unavailable,
  theme,
  t,
}: {
  cached: boolean;
  degraded: boolean;
  loading: boolean;
  unavailable: boolean;
  theme: Theme;
  t: Translate;
}): TodaySourceStatus {
  if (unavailable) {
    return { label: t("publicSourcesUnavailable"), color: theme.colors.error, tone: "error", lamp: "crossed" };
  }
  if (degraded) {
    return { label: t("publicSourcesLimited"), color: theme.colors.warning, tone: "warning", lamp: "half" };
  }
  if (cached) {
    return { label: t("publicSourcesCached"), color: theme.colors.warning, tone: "warning", lamp: "hollow" };
  }
  if (loading) {
    return { label: t("publicSourcesChecking"), color: theme.colors.muted, tone: "muted", lamp: "hollow" };
  }
  return {
    label: t("publicSourcesAreCurrent"),
    color: theme.colors.success,
    tone: "success",
    lamp: "filled",
  };
}

const COMPACT_LABELS: Record<LampShape, Parameters<Translate>[0]> = {
  filled: "statusCurrent",
  hollow: "statusSaved",
  half: "statusLimited",
  crossed: "statusUnavailable",
};

/**
 * The header status column. Phones get one-word labels (the lamp shape carries the same state);
 * screens with room keep the full, specific wording.
 */
export function getTodayChromeStatus(
  sourceStatus: TodaySourceStatus,
  t: Translate,
  colors: Theme["colors"],
  isCompact: boolean,
): TodayChromeStatus {
  if (sourceStatus.tone === "success") {
    return {
      tone: "success",
      color: colors.success,
      label: isCompact ? t("statusCurrent") : t("publicSourcesCurrent"),
      lamp: "filled",
    };
  }
  const checking = sourceStatus.tone === "muted";
  const compactLabel = checking ? t("statusChecking") : t(COMPACT_LABELS[sourceStatus.lamp]);
  return {
    tone: sourceStatus.tone,
    color: sourceStatus.color,
    label: isCompact ? compactLabel : sourceStatus.label,
    lamp: sourceStatus.lamp,
  };
}

export type BoardSlot = {
  title: string;
  /** Time and place, set in Garamond figures. */
  meta: string | null;
  /** An explanation in words. */
  note?: string;
  /** True when the slot states an absence rather than an entry. */
  empty: boolean;
  item?: ScheduleItem;
};

function describeSlot(item: ScheduleItem, locale: string, timeZone: string, range: boolean): string {
  const time = range
    ? formatBoardTimeRange(item.startsAt, item.endsAt, locale, timeZone)
    : formatBoardTime(item.startsAt, locale, timeZone);
  return item.location ? `${time} · ${item.location}` : time;
}

/**
 * Builds the Now/Next board from real schedule entries. It never claims anything the data does not
 * say: no entry in progress reads "Nothing on right now", and an unavailable schedule says so.
 */
/** What the board can know about the schedule right now. */
export type BoardScheduleState = { kind: "ready" } | { kind: "loading" } | { kind: "unavailable"; reason: string };

export function getBoardPresentation({
  current,
  next,
  schedule,
  locale,
  timeZone,
  translate,
}: {
  current: ScheduleItem | undefined;
  next: ScheduleItem | undefined;
  schedule: BoardScheduleState;
  locale: string;
  timeZone: string;
  translate: Translate;
}): { now: BoardSlot; next: BoardSlot | null } {
  if (schedule.kind === "loading") {
    return { now: { title: translate("checkingSchedule"), meta: null, empty: true }, next: null };
  }
  if (schedule.kind === "unavailable") {
    return { now: { title: translate("scheduleNotAvailable"), meta: null, note: schedule.reason, empty: true }, next: null };
  }
  return {
    now: current
      ? { title: current.title, meta: describeSlot(current, locale, timeZone, true), empty: false, item: current }
      : { title: translate("nothingNow"), meta: null, empty: true },
    next: next
      ? { title: next.title, meta: describeSlot(next, locale, timeZone, false), empty: false, item: next }
      : { title: translate("nothingNext"), meta: null, empty: true },
  };
}

export function formatTodayDate(locale: string, timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(now);
}

export function formatCampusTime(locale: string, timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(now);
}
