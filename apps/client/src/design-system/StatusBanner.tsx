/** Renders localized notices for saved, partial, and informational states as a ruled strip. */
import { StyleSheet, Text, View } from "react-native";
import { useLocale } from "@/localization/LocaleContext";
import { formatCacheAge } from "./cacheAge";
import { StatusLamp, useToneColors, type LampShape, type StatusTone } from "./StatusLamp";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeProvider";

type StatusBannerKind = "cached" | "degraded" | "info";

type StatusBannerProps = {
  kind: StatusBannerKind;
  cacheAge?: number | null;
  message?: string;
};

const PRESENTATION: Record<StatusBannerKind, { tone: StatusTone; shape: LampShape }> = {
  cached: { tone: "warning", shape: "hollow" },
  degraded: { tone: "warning", shape: "half" },
  info: { tone: "muted", shape: "hollow" },
};

type MessageContext = {
  cacheAge: StatusBannerProps["cacheAge"];
  locale: ReturnType<typeof useLocale>["locale"];
  t: ReturnType<typeof useLocale>["t"];
};

/** Supplies fallback copy for each status when callers omit a localized message. */
function getDefaultMessage(kind: StatusBannerKind, context: MessageContext): string {
  const messages: Record<StatusBannerKind, string> = {
    cached: context.t("cachedDataAge", { age: formatCacheAge(context.cacheAge ?? 0, context.locale) }),
    degraded: context.t("degradedData"),
    info: context.t("loading"),
  };
  return messages[kind];
}

/** Announces saved, partial, or informational status with a lamp whose shape matches the state. */
export function StatusBanner({ kind, cacheAge, message }: StatusBannerProps): JSX.Element {
  const theme = useTheme();
  const { locale, t } = useLocale();
  const { tone, shape } = PRESENTATION[kind];
  const { ink, wash } = useToneColors(tone);
  const isWarning = tone === "warning";

  return (
    <View
      accessibilityRole={isWarning ? "alert" : undefined}
      accessibilityLiveRegion="polite"
      style={[styles.container, { backgroundColor: wash, borderLeftColor: ink, borderLeftWidth: theme.ui.emphasisBorderWidth }]}
    >
      <View style={styles.lamp}><StatusLamp shape={shape} color={ink} /></View>
      <Text style={[styles.text, { color: theme.colors.text }]}>{message ?? getDefaultMessage(kind, { cacheAge, locale, t })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  lamp: { paddingTop: 5 },
  text: { ...typography.caption, flex: 1 },
});
