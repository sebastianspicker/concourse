/** Renders the offline notice with localized freshness context. */
import { StyleSheet, Text, View } from "react-native";
import { StatusLamp } from "@/design-system/StatusLamp";
import { spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeProvider";
import { useLocale } from "@/localization/LocaleContext";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    columnGap: spacing.sm,
    rowGap: 2,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  text: { ...typography.label },
  subtext: { ...typography.small },
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
      style={[styles.container, { backgroundColor: theme.colors.errorSurface, paddingTop: topPadding + spacing.sm }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <StatusLamp shape="crossed" color={theme.colors.error} />
      <Text style={[styles.text, { color: theme.colors.error }]}>{t("offline")}</Text>
      {hasOfflineData && showCacheAge && (
        <Text style={[styles.subtext, { color: theme.colors.text }]}>{t("offlineShowingSaved")}</Text>
      )}
    </View>
  );
}
