/** Today's heading row: the date as the page heading, and the campus clock in the display voice. */
import { Text, View } from "react-native";
import { useTheme } from "@/design-system/ThemeProvider";
import { styles } from "./ClockBlock.styles";

export function ClockBlock({
  date,
  localTime,
  isWide,
  timeZone,
  campusLocalLabel,
}: {
  date: string;
  localTime: string;
  isWide: boolean;
  timeZone: string;
  campusLocalLabel: string;
}): JSX.Element {
  const theme = useTheme();
  // The zone stays in the spoken label; on screen, "Campus time" is enough.
  const zone = timeZone.replace(/_/g, " ");
  return (
    <View testID="today-clock-block" style={styles.row}>
      <Text accessibilityRole="header" style={[styles.date, !isWide && styles.dateCompact, { color: theme.colors.text }]}>
        {date}
      </Text>
      <View accessible accessibilityLabel={`${campusLocalLabel}, ${zone}: ${localTime}`} style={styles.time}>
        <Text style={[styles.clock, !isWide && styles.clockCompact, { color: theme.colors.text }]}>{localTime}</Text>
        <Text style={[styles.metaText, { color: theme.colors.muted }]}>{campusLocalLabel}</Text>
      </View>
    </View>
  );
}
