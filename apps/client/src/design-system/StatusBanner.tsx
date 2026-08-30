/** Renders localized status banners for offline, stale, degraded, and informational states. */
import { StyleSheet, Text, View } from "react-native";
import { useLocale } from "@/localization/LocaleContext";
import { formatCacheAge } from "./cacheAge";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

type StatusBannerProps = {
  kind: "cached" | "degraded" | "info";
  cacheAge?: number | null;
  message?: string;
};

const WARNING_BANNER_KINDS = new Set<StatusBannerProps["kind"]>(["cached", "degraded"]);

type MessageContext = {
  cacheAge: StatusBannerProps["cacheAge"];
  locale: ReturnType<typeof useLocale>["locale"];
  t: ReturnType<typeof useLocale>["t"];
};

/** Supplies fallback copy for each status when callers omit a localized message. */
function getDefaultMessage(kind: StatusBannerProps["kind"], context: MessageContext): string {
  const messages: Record<StatusBannerProps["kind"], string> = {
    cached: context.t("cachedDataAge", { age: formatCacheAge(context.cacheAge ?? 0, context.locale) }),
    degraded: context.t("degradedData"),
    info: context.t("loading")
  };
  return messages[kind];
}

/** Announces transient information, warning, or error status with matching visual treatment. */
export function StatusBanner({ kind, cacheAge, message }: StatusBannerProps): JSX.Element {
  const theme = useTheme();
  const { locale, t } = useLocale();
  const isWarning = WARNING_BANNER_KINDS.has(kind);
  const backgroundColor = isWarning ? theme.colors.warningSurface : theme.colors.infoSurface;
  const color = isWarning ? theme.colors.warning : theme.colors.info;
  const defaultMessage = getDefaultMessage(kind, { cacheAge, locale, t });

  return (
    <View
      accessibilityRole={isWarning ? "alert" : undefined}
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor: color,
          borderWidth: theme.ui.borderWidth,
        },
      ]}
    >
      <Text style={[styles.text, { color }]}>{message ?? defaultMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: { ...typography.caption, fontWeight: "700", letterSpacing: 0.1 },
});
