/** Builds timeline-shaped schedule placeholders that preserve screen rhythm while loading. */
import { StyleSheet, View } from "react-native";
import { scaled, spacing } from "./theme";
import { getDesignPreset } from "./designPresets";
import { useTheme } from "./ThemeContext";
import { useLocale } from "../i18n/LocaleContext";
import { Skeleton } from "./SkeletonPrimitive";
import { SkeletonLoadingRegion } from "./SkeletonLoadingRegion";

const styles = StyleSheet.create({
  listContainer: {},
  scheduleItem: { flexDirection: "row", alignItems: "stretch" },
  scheduleTime: {
    width: 92,
    justifyContent: "center",
  },
  timeEnd: {
    marginTop: spacing.xs,
  },
  scheduleContent: { flex: 1, justifyContent: "center", gap: spacing.xs },
  scheduleLocation: {
    marginTop: spacing.xs,
  },
});

/** Mimics a schedule row’s time rail and text blocks while data is loading. */
export function SkeletonScheduleItem({ announceLoading = true }: { announceLoading?: boolean }): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const ui = theme.ui;
  const metrics = getDesignPreset(theme.designPreset).metrics;

  return (
    <SkeletonLoadingRegion
      accessibilityLabel={t("loading")}
      announceLoading={announceLoading}
      style={[
        styles.scheduleItem,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: ui.borderWidth,
          minHeight: metrics.rowMinHeight,
          gap: spacing.md,
          paddingHorizontal: scaled(spacing.md, ui),
          paddingVertical: scaled(spacing.md, ui),
        },
      ]}
    >
      <View style={styles.scheduleTime}>
        <Skeleton width={50} height={14} borderRadius={4} />
        <Skeleton width={40} height={12} borderRadius={4} style={styles.timeEnd} />
      </View>
      <View style={styles.scheduleContent}>
        <Skeleton width="70%" height={16} borderRadius={4} />
        <Skeleton width="50%" height={12} borderRadius={4} style={styles.scheduleLocation} />
      </View>
    </SkeletonLoadingRegion>
  );
}

/** Repeats inaccessible schedule placeholders to preserve layout during loading. */
export function SkeletonSchedule({ count = 4 }: { count?: number }): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  return (
    <SkeletonLoadingRegion
      accessibilityLabel={t("loading")}
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
        <SkeletonScheduleItem key={index} announceLoading={false} />
      ))}
    </SkeletonLoadingRegion>
  );
}
