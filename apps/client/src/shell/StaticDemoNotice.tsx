import { StyleSheet, Text, View } from "react-native";
import { isStaticDemo } from "@/data/public/staticDemo";
import { CONTENT_MAX_WIDTH, spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeProvider";
import { useLocale } from "@/localization/LocaleContext";

/** States, once and plainly, that the static demo shows fictional data and simulates outward actions. */
export function StaticDemoNotice({ gutter = spacing.lg }: { gutter?: number }): JSX.Element | null {
  const theme = useTheme();
  const { t } = useLocale();
  if (!isStaticDemo()) return null;

  return (
    <View style={{ backgroundColor: theme.colors.surface }}>
      <View accessibilityLiveRegion="polite" testID="static-demo-notice" style={[styles.notice, { paddingHorizontal: gutter }]}>
        <Text style={[styles.tag, { color: theme.colors.text }]}>{t("demo")}</Text>
        <Text style={[styles.text, { color: theme.colors.muted }]}>{t("staticDemoNotice")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
    paddingVertical: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.md,
  },
  tag: { ...typography.action, fontSize: 13, lineHeight: 18 },
  text: { ...typography.caption, flexShrink: 1 },
});
