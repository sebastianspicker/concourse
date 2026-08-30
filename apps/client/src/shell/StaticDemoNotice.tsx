import { StyleSheet, Text, View } from "react-native";
import { isStaticDemo } from "@/data/public/staticDemo";
import { spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeContext";
import { useLocale } from "@/localization/LocaleContext";

export function StaticDemoNotice(): JSX.Element | null {
  const theme = useTheme();
  const { t } = useLocale();
  if (!isStaticDemo()) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      testID="static-demo-notice"
      style={[styles.notice, { backgroundColor: theme.colors.infoSurface, borderTopColor: theme.colors.border }]}
    >
      <Text style={[styles.text, { color: theme.colors.text }]}>{t("staticDemoNotice")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  text: { ...typography.small, textAlign: "center", fontWeight: "600" },
});
