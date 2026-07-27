/** Composes detail loading, stale selection, empty, error, and retry states consistently. */
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { UiError } from "../api/uiError";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { Screen } from "./Screen";
import { SkeletonDetail } from "./Skeleton";
import { StatusBanner } from "./StatusBanner";
import { getDesignPreset } from "./designPresets";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";
import { useLocale } from "../i18n/LocaleContext";
import { useHydratedWindowWidth } from "./useHydratedWindowWidth";

export type ResourceDetailScreenProps<T> = {
  loading: boolean;
  error: UiError | string | null;
  item: T | null;
  notFoundMessage: string;
  cardTitle: string;
  cardSubtitle?: string;
  renderMeta?: () => ReactNode;
  footnote?: string;
  cached?: boolean;
  cacheAge?: number | null;
  degraded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

type DetailContentProps = Pick<
  ResourceDetailScreenProps<unknown>,
  "error" | "cardTitle" | "cardSubtitle" | "renderMeta" | "footnote" | "cached" | "cacheAge" | "degraded"
> & {
  t: ReturnType<typeof useLocale>["t"];
  theme: ReturnType<typeof useTheme>;
  metrics: ReturnType<typeof getDesignPreset>["metrics"];
  isWide: boolean;
};

/** Displays caller-provided metadata beneath the resource card with consistent spacing. */
const DetailMetadata = ({
  renderMeta,
  theme,
  metrics
}: Pick<DetailContentProps, "renderMeta" | "theme" | "metrics">): JSX.Element | null => {
  if (!renderMeta) return null;

  return (
    <View
      style={[
        styles.meta,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderTopWidth: theme.ui.borderWidth,
          borderBottomWidth: theme.ui.borderWidth,
          paddingHorizontal: metrics.compactGutter
        }
      ]}
    >
      {renderMeta()}
    </View>
  );
};

/** Chooses loading, failure, missing-record, or resolved detail content from resource state. */
const DetailContent = ({
  error,
  cardTitle,
  cardSubtitle,
  renderMeta,
  footnote,
  cached,
  cacheAge,
  degraded,
  t,
  theme,
  metrics,
  isWide,
}: DetailContentProps): JSX.Element => {
  return (
    <View
      style={[
        styles.layout,
        isWide && styles.layoutWide,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderTopWidth: theme.ui.borderWidth,
          borderBottomWidth: theme.ui.borderWidth,
          gap: metrics.sectionGap,
          padding: metrics.contentGap,
        },
      ]}
    >
      <View style={[
        styles.heading,
        isWide ? styles.headingWide : styles.headingNarrow,
        {
          borderColor: theme.colors.border,
          paddingBottom: isWide ? 0 : metrics.contentGap,
          paddingRight: isWide ? metrics.sectionGap : 0,
        },
      ]}>
        <Text selectable accessibilityRole="header" style={[styles.title, isWide && styles.titleWide, { color: theme.colors.text }]}>{cardTitle}</Text>
        {cardSubtitle ? <Text selectable style={[styles.subtitle, { color: theme.colors.muted }]}>{cardSubtitle}</Text> : null}
      </View>
      <View style={styles.body}>
        <DetailStatuses cached={cached} cacheAge={cacheAge} error={error} degraded={degraded} t={t} />
        <DetailMetadata renderMeta={renderMeta} theme={theme} metrics={metrics} />
        {footnote ? <Text selectable style={[styles.footnote, { color: theme.colors.muted }]}>{footnote}</Text> : null}
      </View>
    </View>
  );
};

/** Coordinates pull-to-refresh and error recovery around the selected detail record. */
const renderDetailState = <T,>(props: ResourceDetailScreenProps<T>, t: ReturnType<typeof useLocale>["t"], theme: ReturnType<typeof useTheme>, metrics: ReturnType<typeof getDesignPreset>["metrics"], isWide: boolean): JSX.Element => {
  if (props.item) return <DetailContent {...props} t={t} theme={theme} metrics={metrics} isWide={isWide} />;
  if (props.loading) return <SkeletonDetail />;
  if (props.error) return <ErrorState {...(typeof props.error === "string" ? { message: props.error } : { error: props.error })} onRetry={props.onRefresh} />;
  return <EmptyState message={props.notFoundMessage} hint={t("detailUnavailableHint")} />;
};

/** Selects the localized warning for an incomplete but displayable detail response. */
const getDegradedMessage = (
  error: ResourceDetailScreenProps<unknown>["error"],
  t: ReturnType<typeof useLocale>["t"]
): string | undefined => {
  if (!error || typeof error === "string") return undefined;
  return t(error.messageKey);
};

/** Renders refresh, cache, degraded-source, and error signals before detail content. */
const DetailStatuses = ({
  cached,
  cacheAge,
  error,
  degraded,
  t
}: Pick<DetailContentProps, "cached" | "cacheAge" | "error" | "degraded" | "t">): JSX.Element | null => {
  if (!cached && !error && !degraded) return null;

  return (
    <View style={styles.statuses}>
      {cached ? <StatusBanner kind="cached" cacheAge={cacheAge} /> : null}
      {error || degraded ? <StatusBanner kind="degraded" message={getDegradedMessage(error, t)} /> : null}
    </View>
  );
};

/** Handles loading, stale selection, missing records, and refresh retries for detail navigation. */
export function ResourceDetailScreen<T>(props: ResourceDetailScreenProps<T>): JSX.Element {
  const theme = useTheme();
  const width = useHydratedWindowWidth();
  const metrics = getDesignPreset(theme.designPreset).metrics;
  const { t } = useLocale();

  return (
    <Screen refreshing={props.refreshing} onRefresh={props.onRefresh} maxWidth={1280} testID="detail-screen">
      {renderDetailState(props, t, theme, metrics, width >= 900)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  layout: {},
  layoutWide: { flexDirection: "row", alignItems: "stretch" },
  heading: { gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  headingNarrow: { borderBottomWidth: StyleSheet.hairlineWidth },
  headingWide: { width: "38%", borderBottomWidth: 0, borderRightWidth: StyleSheet.hairlineWidth },
  title: { ...typography.heading },
  titleWide: { ...typography.display, fontSize: 44, lineHeight: 50, letterSpacing: -1.2 },
  subtitle: { ...typography.body, maxWidth: 620 },
  body: { flex: 1, minWidth: 0, gap: spacing.lg },
  statuses: { gap: spacing.sm },
  meta: {},
  footnote: { ...typography.caption, maxWidth: 560 },
});
