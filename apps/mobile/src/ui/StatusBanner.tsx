import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocale } from "../i18n/LocaleContext";
import { formatCacheAge } from "../components/cacheAge";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

type StatusBannerProps = {
  kind: "cached" | "degraded" | "info";
  cacheAge?: number | null;
  message?: string;
};

export function StatusBanner({ kind, cacheAge, message }: StatusBannerProps): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const isWarning = kind === "cached" || kind === "degraded";
  const backgroundColor = isWarning ? theme.colors.warningSurface : theme.colors.infoSurface;
  const color = isWarning ? theme.colors.warning : theme.colors.info;
  const defaultMessage = kind === "cached"
    ? t("cachedDataAge", { age: formatCacheAge(cacheAge ?? 0) })
    : kind === "degraded"
      ? t("degradedData")
      : t("loading");

  return (
    <View
      accessibilityRole={isWarning ? "alert" : undefined}
      accessibilityLiveRegion="polite"
      style={[styles.container, { backgroundColor, borderColor: color }]}
    >
      <Text style={[styles.text, { color }]}>{message ?? defaultMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: { ...typography.caption, fontWeight: "600" },
});
