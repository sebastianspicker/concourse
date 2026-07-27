/** Renders offline and cached-data notices with localized freshness context. */
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../ui/theme";
import { useTheme } from "../ui/ThemeContext";
import { formatCacheAge } from "./cacheAge";
import { useLocale } from "../i18n/LocaleContext";

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    ...typography.caption,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  subtext: {
    ...typography.small,
    marginTop: 2,
  },
});

/** Announces loss of connectivity with a localized, screen-reader-visible status message. */
export function OfflineBanner({
  topPadding,
  hasOfflineData,
  showCacheAge,
}: {
  topPadding: number;
  hasOfflineData: boolean;
  showCacheAge: boolean;
}): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.errorSurface, paddingTop: topPadding + 8 },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Text style={[styles.text, { color: theme.colors.error }]}>{t("offline")}</Text>
      {hasOfflineData && showCacheAge && (
        <Text style={[styles.subtext, { color: theme.colors.error }]}>{t("cachedData")}</Text>
      )}
    </View>
  );
}

/** Explains that displayed content came from saved data instead of a live request. */
export function CachedDataBanner({
  topPadding,
  cacheAge,
}: {
  topPadding: number;
  cacheAge: number | null;
}): JSX.Element {
  const theme = useTheme();
  const { locale, t } = useLocale();
  const ageText = cacheAge ? formatCacheAge(cacheAge, locale) : "";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.warningSurface, paddingTop: topPadding + 8 },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.warning }]}>
        {ageText ? t("cachedDataAge", { age: ageText }) : t("cachedData")}
      </Text>
    </View>
  );
}
