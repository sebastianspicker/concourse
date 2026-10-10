/** Static, non-animated loading placeholders shaped like the board rows and detail facts they precede. */
import type { ReactNode } from "react";
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { BOARD_TIME_COLUMN, scaled, spacing } from "./theme";
import { useTheme, useDesignMetrics } from "./ThemeProvider";
import { useLocale } from "@/localization/LocaleContext";
import type { ResourceListItemVariant } from "./ResourceListItem";

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.lg, paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xs },
  leading: { width: BOARD_TIME_COLUMN, gap: spacing.xs },
  copy: { flex: 1, gap: spacing.sm },
  detail: { gap: spacing.lg },
  facts: { borderTopWidth: 2 },
  fact: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth },
});

export type SkeletonProps = { width?: DimensionValue; height?: number; style?: ViewStyle };

/** Draws a neutral loading block that stays hidden from assistive technologies. */
export function Skeleton({ width = 300, height = 16, style }: SkeletonProps): JSX.Element {
  const theme = useTheme();
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height: Math.max(2, scaled(height, theme.ui)),
          borderRadius: 1,
          backgroundColor: theme.colors.border,
        },
        style,
      ]}
    />
  );
}

/** Exposes one busy status for the whole placeholder region. */
function LoadingRegion({ label, children, style }: { label: string; children: ReactNode; style?: StyleProp<ViewStyle> }): JSX.Element {
  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar" accessibilityState={{ busy: true }} style={style}>
      {children}
    </View>
  );
}

function SkeletonRow({ variant, index }: { variant: ResourceListItemVariant; index: number }): JSX.Element {
  const theme = useTheme();
  const metrics = useDesignMetrics();
  const titleWidth: DimensionValue = ["62%", "48%", "70%"][index % 3] as DimensionValue;
  return (
    <View style={[styles.row, { minHeight: metrics.rowMinHeight, borderBottomColor: theme.colors.border, borderBottomWidth: theme.ui.borderWidth }]}>
      {variant === "standard" ? null : (
        <View style={styles.leading}>
          <Skeleton width={variant === "event" ? 28 : 48} height={variant === "event" ? 10 : 16} />
          <Skeleton width={variant === "event" ? 32 : 40} height={variant === "event" ? 22 : 12} />
        </View>
      )}
      <View style={styles.copy}>
        <Skeleton width={titleWidth} height={16} />
        <Skeleton width="34%" height={12} />
      </View>
    </View>
  );
}

/** Repeats row placeholders to prevent content reflow while a list loads. */
export function SkeletonList({ count = 3, variant = "standard" }: { count?: number; variant?: ResourceListItemVariant }): JSX.Element {
  const { t } = useLocale();
  return (
    <LoadingRegion label={t("loading")}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonRow key={index} variant={variant} index={index} />
      ))}
    </LoadingRegion>
  );
}

/** Matches the detail layout: kicker, title, subtitle, then a ruled fact table. */
export function SkeletonDetail(): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  return (
    <LoadingRegion label={t("loading")} style={styles.detail}>
      <Skeleton width={72} height={12} />
      <Skeleton width="64%" height={34} />
      <Skeleton width="40%" height={16} />
      <View style={[styles.facts, { borderTopColor: theme.colors.border }]}>
        {["52%", "38%", "46%"].map((width) => (
          <View key={width} style={[styles.fact, { borderBottomColor: theme.colors.border }]}>
            <Skeleton width={84} height={10} />
            <Skeleton width={width as DimensionValue} height={14} />
          </View>
        ))}
      </View>
    </LoadingRegion>
  );
}
