import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

export function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.group} accessibilityRole="summary">
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <View style={[styles.rows, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export function ChoiceRow({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}): JSX.Element {
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
        { borderBottomColor: theme.colors.border, backgroundColor: pressed ? theme.colors.infoSurface : theme.colors.surface },
      ]}
    >
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <MaterialIcons
        name={selected ? "radio-button-checked" : "radio-button-unchecked"}
        size={24}
        color={selected ? theme.colors.accent : theme.colors.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  title: { ...typography.subheading },
  rows: { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  row: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { ...typography.body, flex: 1 },
});
