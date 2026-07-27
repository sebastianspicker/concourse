/** Shows localized data freshness only when a resource timestamp is available. */
import { StyleSheet, Text, View } from "react-native";
import { formatCacheAge } from "../components/cacheAge";
import { useLocale } from "../i18n/LocaleContext";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

/** Displays localized refresh time only when the resource has a trustworthy network timestamp. */
export function FreshnessIndicator({ updatedAt }: { updatedAt: number | null }): JSX.Element | null {
  const theme = useTheme();
  const { locale, t } = useLocale();
  if (updatedAt === null) return null;

  const age = formatCacheAge(Math.max(0, Date.now() - updatedAt), locale);
  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.dot, { backgroundColor: theme.colors.accent }]}
      />
      <Text style={[styles.text, { color: theme.colors.muted }]}>{t("currentDataAge", { age })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 24, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { ...typography.caption, fontWeight: "500" },
});
