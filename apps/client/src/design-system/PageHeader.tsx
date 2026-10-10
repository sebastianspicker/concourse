import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeProvider";
import { useHydratedWindowWidth } from "@/design-system/useHydratedWindowWidth";

/** Page title with a one-line statement of where the information comes from. */
export function PageHeader({ title, intro }: { title: string; intro?: string }): JSX.Element {
  const theme = useTheme();
  const compact = useHydratedWindowWidth() < 600;
  return (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, { color: theme.colors.text }]}>{title}</Text>
      {intro ? <Text style={[styles.intro, { color: theme.colors.muted }]}>{intro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  title: { ...typography.title },
  titleCompact: { fontSize: 40, lineHeight: 46, letterSpacing: -0.4 },
  intro: { ...typography.body, maxWidth: 620 },
});
