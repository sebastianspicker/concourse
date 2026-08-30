import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeContext";

export function CurrentMomentLine({ caption }: { caption: string }): JSX.Element {
  const theme = useTheme();
  return (
    <View
      testID="today-current-line"
      style={[styles.currentLine, { borderBottomColor: theme.colors.signal }]}
    >
      <View
        style={[
          styles.currentMarker,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.signal },
        ]}
      />
      <View
        style={[
          styles.currentCaption,
          { backgroundColor: theme.colors.warningSurface, borderColor: theme.colors.signal },
        ]}
      >
        <Text style={[styles.currentCaptionText, { color: theme.colors.signalText }]}>
          {caption}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  currentLine: {
    height: 40,
    borderBottomWidth: 2,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  currentMarker: {
    position: "absolute",
    left: 0,
    bottom: -10,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
  },
  currentCaption: {
    marginLeft: 26,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  currentCaptionText: {
    ...typography.small,
    fontWeight: "600",
  },
});
