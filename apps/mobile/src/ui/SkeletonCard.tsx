/** Builds static card and list placeholders for data-loading surfaces. */
import { StyleSheet, View } from "react-native";
import { scaled, spacing } from "./theme";
import { getDesignPreset } from "./designPresets";
import { useTheme } from "./ThemeContext";
import { useLocale } from "../i18n/LocaleContext";
import { Skeleton } from "./SkeletonPrimitive";

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
  listContainer: {},
});

/** Draws an inaccessible card-shaped placeholder with theme-aware surfaces. */
export function SkeletonCard({ announceLoading = true }: { announceLoading?: boolean }): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const ui = theme.ui;
  const metrics = getDesignPreset(theme.designPreset).metrics;

  return (
    <View
      {...(announceLoading
        ? {
            accessibilityLabel: t("loading"),
            accessibilityRole: "progressbar" as const,
            accessibilityState: { busy: true },
          }
        : {
            accessible: false,
            accessibilityElementsHidden: true,
            importantForAccessibility: "no-hide-descendants" as const,
          })}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: ui.borderWidth,
          minHeight: metrics.rowMinHeight,
          paddingHorizontal: scaled(spacing.md, ui),
          paddingVertical: scaled(spacing.lg, ui),
        },
      ]}
    >
      <View style={styles.copy}>
        <Skeleton width="60%" height={18} borderRadius={0} />
        <Skeleton width="45%" height={14} borderRadius={0} />
      </View>
      <Skeleton width={20} height={20} borderRadius={0} />
    </View>
  );
}

/** Repeats card placeholders to prevent content reflow while a list loads. */
export function SkeletonList({ count = 3 }: { count?: number }): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  return (
    <View
      accessibilityLabel={t("loading")}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={[
        styles.listContainer,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: theme.ui.borderWidth,
        },
      ]}
    >
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <SkeletonCard announceLoading={false} />
        </View>
      ))}
    </View>
  );
}
