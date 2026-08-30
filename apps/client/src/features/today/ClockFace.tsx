import { StyleSheet, Text } from "react-native";

export function ClockFace({
  localTime,
  textColor,
  colonColor,
}: {
  localTime: string;
  textColor: string;
  colonColor: string;
}): JSX.Element {
  if (!localTime.includes(":")) {
    return <Text style={[styles.clock, { color: textColor }]}>{localTime}</Text>;
  }

  const parts = localTime.split(":");
  return (
    <Text style={[styles.clock, { color: textColor }]} accessibilityRole="text">
      {parts.map((part, index) => (
        <Text key={`clock-part-${index}`}>
          {index > 0 ? <Text style={{ color: colonColor }}>:</Text> : null}
          {part}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  clock: {
    fontSize: 92,
    lineHeight: 86,
    letterSpacing: -4,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
});
