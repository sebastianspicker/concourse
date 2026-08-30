import { Text, View } from "react-native";
import { useTheme } from "@/design-system/ThemeContext";
import { ClockFace } from "./ClockFace";
import { styles } from "./ClockBlock.styles";
import { ClockMeta } from "./ClockMeta";
import { FreshnessRow } from "./FreshnessRow";
import type { TodaySourceTone } from "./todaySourceStatus";

export function ClockBlock({
  date,
  localTime,
  isWide,
  timeZone,
  campusLocalLabel,
  showFreshnessChip,
  chromeLabel,
  chromeColor,
  chromeTone,
}: {
  date: string;
  localTime: string;
  isWide: boolean;
  timeZone: string;
  campusLocalLabel: string;
  showFreshnessChip: boolean;
  chromeLabel: string;
  chromeColor: string;
  chromeTone: TodaySourceTone;
}): JSX.Element {
  const theme = useTheme();
  return (
    <View
      testID="today-clock-block"
      style={[
        styles.clockBlock,
        isWide && styles.clockBlockWide,
        { borderColor: theme.colors.border },
      ]}
    >
      <Text accessibilityRole="header" style={[styles.date, { color: theme.colors.muted }]}>
        {date}
      </Text>
      <ClockFace
        localTime={localTime}
        textColor={theme.colors.text}
        colonColor={theme.colors.signal}
      />
      {isWide ? (
        <ClockMeta campusLocalLabel={campusLocalLabel} timeZone={timeZone} />
      ) : null}
      {showFreshnessChip ? (
        <FreshnessRow label={chromeLabel} color={chromeColor} tone={chromeTone} />
      ) : null}
    </View>
  );
}
