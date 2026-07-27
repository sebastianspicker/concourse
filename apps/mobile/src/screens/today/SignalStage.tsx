/** Composes the Quiet Chronograph clock, Now/Next board, and current-moment rule. */
import { StyleSheet, View } from "react-native";
import type { ScheduleItem } from "@concourse/shared";
import { useLocale } from "@/i18n/LocaleContext";
import { spacing } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import { formatScheduleTime } from "@/utils/dateFormat";
import { ClockBlock } from "./ClockBlock";
import { CurrentMomentLine } from "./CurrentMomentLine";
import { SignalBoard } from "./SignalBoard";
import { tr } from "./todayClockFormat";
import {
  getTodayChromeStatus,
  type TodaySourceStatus,
} from "./todaySourceStatus";

/** Renders the approved Quiet Chronograph clock and live campus signal composition. */
export function SignalStage({
  date,
  localTime,
  nextItem,
  sourceStatus,
  locale,
  timeZone,
  isWide,
  showFreshnessChip = true,
}: {
  date: string;
  localTime: string;
  nextItem: ScheduleItem | undefined;
  sourceStatus: TodaySourceStatus;
  locale: string;
  timeZone: string;
  isWide: boolean;
  /** When false, a parent is publishing freshness to chrome (header). Default true as fallback. */
  showFreshnessChip?: boolean;
}): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const chromeStatus = getTodayChromeStatus(sourceStatus, locale, theme.colors, !isWide);
  const nextMeta = nextItem
    ? `${formatScheduleTime(nextItem.startsAt, locale, timeZone)}${
        nextItem.location ? ` · ${nextItem.location}` : ""
      }`
    : null;

  return (
    <>
      <View
        style={[
          styles.signalStage,
          isWide && styles.signalStageWide,
          { borderColor: theme.colors.border },
        ]}
      >
        <ClockBlock
          date={date}
          localTime={localTime}
          isWide={isWide}
          timeZone={timeZone}
          campusLocalLabel={tr(locale, "campusLocalTime", "Campus local time")}
          showFreshnessChip={showFreshnessChip}
          chromeLabel={chromeStatus.label}
          chromeColor={chromeStatus.color}
          chromeTone={chromeStatus.tone}
        />
        <SignalBoard
          isWide={isWide}
          nowTitle={tr(locale, "campusIsOpen", t("campusInformation"))}
          sourceLabel={sourceStatus.label}
          nextTitle={nextItem?.title ?? t("noSchedule")}
          nextMeta={nextMeta}
        />
      </View>
      <CurrentMomentLine caption={tr(locale, "currentMoment", t("now"))} />
    </>
  );
}

const styles = StyleSheet.create({
  signalStage: { gap: spacing.lg },
  signalStageWide: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.xl,
  },
});
