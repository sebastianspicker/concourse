import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "./theme";
import { getDesignPreset } from "./designPresets";
import { useTheme } from "./ThemeContext";

export type EmptyStateProps = { message: string; icon?: string; hint?: string };

export function EmptyState({ message, hint }: EmptyStateProps): JSX.Element {
  const theme = useTheme();
  const metrics = getDesignPreset(theme.designPreset).metrics;
  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.colors.border,
          borderTopWidth: theme.ui.borderWidth,
          borderBottomWidth: theme.ui.borderWidth,
          paddingVertical: metrics.contentGap,
        },
      ]}
    >
      <Text selectable style={[styles.message, { color: theme.colors.text }]}>{message}</Text>
      {hint ? <Text style={[styles.hint, { color: theme.colors.muted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  message: { ...typography.body, fontWeight: "600" },
  hint: { ...typography.caption, maxWidth: 520 },
});
