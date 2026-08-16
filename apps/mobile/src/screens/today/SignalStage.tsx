/** Composes the Quiet Chronograph clock, Now/Next board, and current-moment rule. */
import { View } from "react-native";
import type { ScheduleItem } from "@concourse/shared";
import { useLocale } from "@/i18n/LocaleContext";
import { useTheme } from "@/ui/ThemeContext";
import { ClockBlock } from "./ClockBlock";
import { CurrentMomentLine } from "./CurrentMomentLine";
import { SignalBoard } from "./SignalBoard";
import { styles } from "./SignalStage.styles";
import { signalStagePresentation } from "./signalStagePresentation";
import type { TodaySourceStatus } from "./todaySourceStatus";

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
  const presentation = signalStagePresentation({
    nextItem,
    sourceStatus,
    locale,
    timeZone,
    isWide,
    colors: theme.colors,
    translate: t,
  });

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
          campusLocalLabel={presentation.campusLocalLabel}
          showFreshnessChip={showFreshnessChip}
          chromeLabel={presentation.chromeStatus.label}
          chromeColor={presentation.chromeStatus.color}
          chromeTone={presentation.chromeStatus.tone}
        />
        <SignalBoard
          isWide={isWide}
          nowTitle={presentation.nowTitle}
          sourceLabel={sourceStatus.label}
          nextTitle={presentation.nextTitle}
          nextMeta={presentation.nextMeta}
        />
      </View>
      <CurrentMomentLine caption={presentation.currentMomentCaption} />
    </>
  );
}
