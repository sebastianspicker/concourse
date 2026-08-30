import { Text, View } from "react-native";
import { useTheme } from "@/design-system/ThemeContext";
import { styles } from "./ClockBlock.styles";

export function ClockMeta({
  campusLocalLabel,
  timeZone,
}: {
  campusLocalLabel: string;
  timeZone: string;
}): JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.clockMeta}>
      <Text style={[styles.clockMetaLabel, { color: theme.colors.muted }]}>
        {campusLocalLabel}
      </Text>
      <View
        style={[
          styles.tzChip,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <Text style={[styles.tzChipText, { color: theme.colors.muted }]}>{timeZone}</Text>
      </View>
    </View>
  );
}
