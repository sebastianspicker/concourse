/** Renders an accessible single-choice settings row with selected-state affordance. */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text } from "react-native";
import { spacing, typography, withOpacity } from "./theme";
import { useTheme } from "./ThemeContext";

export type ChoiceRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

/** Implements a radio-style preference row with checked state for assistive technology. */
export function ChoiceRow({ label, selected, onPress, testID }: ChoiceRowProps): JSX.Element {
  const theme = useTheme();
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
          backgroundColor: pressed || selected
            ? withOpacity(theme.colors.accent, pressed ? 0.14 : 0.07)
            : theme.colors.surface,
          minHeight: 60,
          borderBottomWidth: theme.ui.borderWidth,
        },
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel, { color: theme.colors.text }]}>{label}</Text>
      <MaterialIcons
        name={selected ? "radio-button-checked" : "radio-button-unchecked"}
        size={24}
        color={selected ? theme.colors.accent : theme.colors.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  label: { ...typography.body, flex: 1 },
  selectedLabel: { fontWeight: "600" },
});
