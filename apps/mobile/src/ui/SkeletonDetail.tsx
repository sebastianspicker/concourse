/** Builds detail-page placeholder structure used while a route resolves. */
import { StyleSheet, View } from "react-native";
import { scaled, spacing } from "./theme";
import { getDesignPreset } from "./designPresets";
import { useTheme } from "./ThemeContext";
import { useLocale } from "../i18n/LocaleContext";
import { Skeleton } from "./SkeletonPrimitive";

const styles = StyleSheet.create({
  detailContainer: {},
  detailHeader: { gap: spacing.sm },
  detailSection: {},
  metaRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actions: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: spacing.sm },
});

function SkeletonMetaRow({ valueWidth }: { valueWidth: `${number}%` }): JSX.Element {
  const theme = useTheme();
  return (
    <View style={[styles.metaRow, { borderBottomColor: theme.colors.border }]}>
      <Skeleton width="22%" height={14} borderRadius={4} />
      <Skeleton width={valueWidth} height={16} borderRadius={4} />
    </View>
  );
}

/** Provides an inaccessible visual placeholder that matches the detail screen’s metadata layout. */
export function SkeletonDetail(): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const ui = theme.ui;
  const metrics = getDesignPreset(theme.designPreset).metrics;
  const sectionStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderTopWidth: ui.borderWidth,
    borderBottomWidth: ui.borderWidth,
    paddingHorizontal: scaled(metrics.compactGutter, ui),
  };

  return (
    <View
      accessibilityLabel={t("loading")}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={[styles.detailContainer, { gap: metrics.sectionGap }]}
    >
      <View
        style={[
          styles.detailHeader,
          {
            borderBottomColor: theme.colors.border,
            borderBottomWidth: StyleSheet.hairlineWidth,
            paddingBottom: metrics.contentGap,
          },
        ]}
      >
        <Skeleton width="70%" height={28} borderRadius={6} />
        <Skeleton width="42%" height={16} borderRadius={4} />
      </View>
      <View style={[styles.detailSection, sectionStyle]}>
        <SkeletonMetaRow valueWidth="55%" />
        <SkeletonMetaRow valueWidth="68%" />
        <SkeletonMetaRow valueWidth="46%" />
        <View style={styles.actions}>
          <Skeleton width={140} height={44} borderRadius={metrics.controlRadius} />
          <Skeleton width={92} height={44} borderRadius={metrics.controlRadius} />
        </View>
      </View>
    </View>
  );
}
