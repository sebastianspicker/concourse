/** Renders an accessible single-choice settings row with a drawn radio indicator. */
import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, typography, withOpacity } from "./theme";
import { useTheme, useDesignMetrics } from "./ThemeProvider";

export type ChoiceRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

function RadioMark({ selected }: { selected: boolean }): JSX.Element {
  const theme = useTheme();
  const color = selected ? theme.colors.text : theme.colors.controlBorder;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.ring, { borderColor: color, borderWidth: selected ? 2 : 1.5 }]}
    >
      {selected ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
    </View>
  );
}

/** Implements a radio-style preference row with checked state for assistive technology. */
export function ChoiceRow({ label, selected, onPress, testID }: ChoiceRowProps): JSX.Element {
  const theme = useTheme();
  const metrics = useDesignMetrics();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: theme.colors.border,
          borderBottomWidth: theme.ui.borderWidth,
          backgroundColor: pressed ? withOpacity(theme.colors.text, 0.08) : "transparent",
          minHeight: Math.max(52, metrics.rowMinHeight - 8),
        },
      ]}
    >
      <RadioMark selected={selected} />
      <Text style={[selected ? styles.labelSelected : styles.label, { color: theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  ring: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { ...typography.body, flex: 1 },
  labelSelected: { ...typography.bodyStrong, flex: 1 },
});
