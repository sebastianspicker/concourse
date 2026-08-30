import type { ScheduleItem } from "@concourse/contracts";
import type { useLocale } from "@/localization/LocaleContext";
import type { useTheme } from "@/design-system/ThemeContext";
import { formatScheduleTime } from "@/localization/dateFormat";
import { tr } from "./todayClockFormat";
import { getTodayChromeStatus, type TodaySourceStatus } from "./todaySourceStatus";

export function signalStagePresentation({
  nextItem,
  sourceStatus,
  locale,
  timeZone,
  isWide,
  colors,
  translate,
}: {
  nextItem: ScheduleItem | undefined;
  sourceStatus: TodaySourceStatus;
  locale: string;
  timeZone: string;
  isWide: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  translate: ReturnType<typeof useLocale>["t"];
}) {
  return {
    chromeStatus: getTodayChromeStatus(sourceStatus, locale, colors, !isWide),
    nextMeta: nextItem
      ? `${formatScheduleTime(nextItem.startsAt, locale, timeZone)}${
          nextItem.location ? ` · ${nextItem.location}` : ""
        }`
      : null,
    campusLocalLabel: tr(locale, "campusLocalTime", "Campus local time"),
    nowTitle: tr(locale, "campusIsOpen", translate("campusInformation")),
    nextTitle: nextItem?.title ?? translate("noSchedule"),
    currentMomentCaption: tr(locale, "currentMoment", translate("now")),
  };
}
