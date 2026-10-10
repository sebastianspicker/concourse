import { StyleSheet, Text, View } from "react-native";
import { useLocale } from "@/localization/LocaleContext";
import { StatusTag } from "./StatusLamp";
import { spacing, typography } from "./theme";
import { useTheme, useDesignMetrics } from "./ThemeProvider";

export type EmptyStateProps = { message: string; hint?: string; label?: string };

/** An empty board: says plainly that there is nothing to show, and why it might be so. */
export function EmptyState({ message, hint, label }: EmptyStateProps): JSX.Element {
  const theme = useTheme();
  const metrics = useDesignMetrics();
  const { t } = useLocale();
  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: theme.colors.border,
          borderBottomWidth: theme.ui.borderWidth,
          paddingVertical: metrics.contentGap,
        },
      ]}
    >
      <StatusTag label={label ?? t("noEntries")} tone="muted" shape="hollow" />
      <Text selectable style={[styles.message, { color: theme.colors.text }]}>{message}</Text>
      {hint ? <Text style={[styles.hint, { color: theme.colors.muted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingHorizontal: spacing.xs },
  message: { ...typography.cardTitle, marginTop: spacing.xs },
  hint: { ...typography.caption, maxWidth: 520 },
});
