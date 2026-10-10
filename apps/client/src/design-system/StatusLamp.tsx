/** Board-style status lamps: the shape carries the meaning, color only reinforces it. */
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeProvider";

/** filled = current, hollow = saved/checking, half = limited, crossed = offline/unavailable. */
export type LampShape = "filled" | "hollow" | "half" | "crossed";

export type StatusTone = "success" | "warning" | "error" | "muted";

type ToneColors = { ink: string; wash: string };

/** Resolves the readable ink and quiet wash for a status tone. */
export function useToneColors(tone: StatusTone): ToneColors {
  const { colors } = useTheme();
  switch (tone) {
    case "success":
      return { ink: colors.success, wash: colors.successSurface };
    case "warning":
      return { ink: colors.warning, wash: colors.warningSurface };
    case "error":
      return { ink: colors.error, wash: colors.errorSurface };
    default:
      return { ink: colors.muted, wash: colors.background };
  }
}

/** Draws a 10 pt square lamp whose fill pattern encodes state without relying on color. */
export function StatusLamp({ shape, color, size = 10 }: { shape: LampShape; color: string; size?: number }): JSX.Element {
  const frame = { width: size, height: size, borderColor: color, borderWidth: Math.max(1.5, size / 6) };
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.lamp, frame, shape === "filled" && { backgroundColor: color }]}
    >
      {shape === "half" ? <View style={[styles.half, { backgroundColor: color }]} /> : null}
      {shape === "crossed" ? (
        <>
          <View style={[styles.stroke, styles.strokeA, { backgroundColor: color }]} />
          <View style={[styles.stroke, styles.strokeB, { backgroundColor: color }]} />
        </>
      ) : null}
    </View>
  );
}

/** A lamp plus a short label: the status column of every list. */
export function StatusTag({
  label,
  tone,
  shape,
  testID,
  live = false,
}: {
  label: string;
  tone: StatusTone;
  shape: LampShape;
  testID?: string;
  live?: boolean;
}): JSX.Element {
  const { ink } = useToneColors(tone);
  const { colors } = useTheme();
  // Healthy states stay quiet; only problems put their color into the words.
  const labelColor = tone === "warning" || tone === "error" ? ink : colors.muted;
  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLiveRegion={live ? "polite" : undefined}
      style={styles.tag}
    >
      <StatusLamp shape={shape} color={ink} size={9} />
      <Text numberOfLines={2} style={[styles.tagLabel, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lamp: { overflow: "hidden", borderRadius: 1 },
  half: { position: "absolute", left: 0, top: 0, bottom: 0, width: "50%" },
  stroke: { position: "absolute", left: "50%", top: "-20%", width: 1.5, height: "140%", marginLeft: -0.75 },
  strokeA: { transform: [{ rotate: "45deg" }] },
  strokeB: { transform: [{ rotate: "-45deg" }] },
  tag: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minWidth: 0, flexShrink: 1 },
  tagLabel: { ...typography.label, flexShrink: 1 },
});
