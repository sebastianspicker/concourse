/** Renders one line of a ruled fact table: a label column and a selectable value. */
import { StyleSheet, Text, View } from "react-native";
import { scaled, spacing, typography } from "./theme";
import { useTheme } from "./ThemeProvider";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: spacing.lg,
    rowGap: spacing.xs,
  },
  label: { ...typography.captionStrong, flexBasis: 128, flexGrow: 0 },
  value: { ...typography.body, flex: 1, flexBasis: 180 },
  valueData: { ...typography.data, flex: 1, flexBasis: 180 },
});

/** Aligns a detail label and value while preserving selectable source text. */
export function MetaRow({
  label,
  value,
  data = false,
}: {
  label: string;
  value: string;
  /** Sets the value in Garamond figures: dates and times. Prose, codes, and URLs stay in the sans. */
  data?: boolean;
}): JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: theme.colors.border,
          borderBottomWidth: theme.ui.borderWidth,
          paddingVertical: scaled(spacing.md + 2, theme.ui),
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.colors.muted }]}>{label}</Text>
      <Text selectable style={[data ? styles.valueData : styles.value, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}
