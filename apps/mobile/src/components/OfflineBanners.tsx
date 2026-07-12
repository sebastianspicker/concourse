import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../ui/theme";
import { useTheme } from "../ui/ThemeContext";
import { formatCacheAge } from "./cacheAge";
import { useLocale } from "../i18n/LocaleContext";

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    ...typography.caption,
    fontWeight: "600",
  },
  subtext: {
    ...typography.small,
    marginTop: 2,
  },
});

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

export function CachedDataBanner({
  topPadding,
  cacheAge,
}: {
  topPadding: number;
  cacheAge: number | null;
}): JSX.Element {
  const theme = useTheme();
  const ageText = cacheAge ? formatCacheAge(cacheAge) : "";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.warningSurface, paddingTop: topPadding + 8 },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.warning }]}>
        Offline data{ageText ? ` (${ageText})` : ""}
      </Text>
    </View>
  );
}
