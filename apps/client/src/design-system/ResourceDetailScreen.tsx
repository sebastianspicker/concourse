/** Composes detail loading, stale selection, empty, error, and retry states consistently. */
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { UiError } from "@/platform/http/uiError";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { Screen } from "./Screen";
import { SkeletonDetail } from "./Skeleton";
import { StatusBanner } from "./StatusBanner";
import { CONTENT_MAX_WIDTH, spacing, typography } from "./theme";
import { useTheme, useDesignMetrics } from "./ThemeProvider";
import { useLocale } from "@/localization/LocaleContext";
import { useHydratedWindowWidth } from "./useHydratedWindowWidth";
import { getErrorMessage } from "./errorStatePresentation";

export type ResourceDetailScreenProps<T> = {
  loading: boolean;
  error: UiError | null;
  item: T | null;
  notFoundMessage: string;
  /** Small label naming the record type, e.g. "Event". */
  kicker?: string;
  cardTitle: string;
  /** The record's key fact (usually its time), set under the title. */
  cardSubtitle?: string;
  renderMeta?: () => ReactNode;
  /** Actions shown under the fact table. */
  renderActions?: () => ReactNode;
  footnote?: string;
  cached?: boolean;
  cacheAge?: number | null;
  degraded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

type DetailContentProps = Pick<
  ResourceDetailScreenProps<unknown>,
  "error" | "kicker" | "cardTitle" | "cardSubtitle" | "renderMeta" | "renderActions" | "footnote" | "cached" | "cacheAge" | "degraded"
> & { isWide: boolean };

/** Renders the title block: record kind, title, and key fact. */
function DetailHeading({ kicker, cardTitle, cardSubtitle, isWide }: Pick<DetailContentProps, "kicker" | "cardTitle" | "cardSubtitle" | "isWide">): JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.heading}>
      {kicker ? <Text style={[styles.kicker, { color: theme.colors.muted }]}>{kicker}</Text> : null}
      <Text selectable accessibilityRole="header" style={[isWide ? styles.titleWide : styles.title, { color: theme.colors.text }]}>{cardTitle}</Text>
      {cardSubtitle ? <Text selectable style={[styles.subtitle, { color: theme.colors.text }]}>{cardSubtitle}</Text> : null}
    </View>
  );
}

/** Lays out the resolved record in one reading column: heading, state notices, facts, actions. */
function DetailContent(props: DetailContentProps): JSX.Element {
  const { error, renderMeta, renderActions, footnote, cached, cacheAge, degraded, isWide } = props;
  const theme = useTheme();
  const metrics = useDesignMetrics();
  return (
    <View style={[styles.layout, { gap: metrics.contentGap + (isWide ? spacing.sm : 0) }]}>
      <DetailHeading {...props} />
      <DetailStatuses cached={cached} cacheAge={cacheAge} error={error} degraded={degraded} />
      {renderMeta ? (
        <View style={{ borderTopColor: theme.colors.text, borderTopWidth: 1.5 }}>{renderMeta()}</View>
      ) : null}
      {renderActions ? <View style={[styles.actions, !isWide && styles.actionsStacked]}>{renderActions()}</View> : null}
      {footnote ? <Text selectable style={[styles.footnote, { color: theme.colors.muted }]}>{footnote}</Text> : null}
    </View>
  );
}

/** Renders cache, degraded-source, and error signals before detail content. */
function DetailStatuses({ cached, cacheAge, error, degraded }: Pick<DetailContentProps, "cached" | "cacheAge" | "error" | "degraded">): JSX.Element | null {
  const { t } = useLocale();
  if (!cached && !error && !degraded) return null;

  return (
    <View style={styles.statuses}>
      {cached ? <StatusBanner kind="cached" cacheAge={cacheAge} /> : null}
      {error || degraded ? <StatusBanner kind="degraded" message={error ? getErrorMessage(error, undefined, t) : undefined} /> : null}
    </View>
  );
}

/** Chooses loading, failure, missing-record, or resolved detail content from resource state. */
function DetailState<T>({ props, isWide }: { props: ResourceDetailScreenProps<T>; isWide: boolean }): JSX.Element {
  const { t } = useLocale();
  if (props.item) return <DetailContent {...props} isWide={isWide} />;
  if (props.loading) return <SkeletonDetail />;
  if (props.error) return <ErrorState error={props.error} onRetry={props.onRefresh} />;
  return <EmptyState label={t("notFoundLabel")} message={props.notFoundMessage} hint={t("detailUnavailableHint")} />;
}

/** Handles loading, stale selection, missing records, and refresh retries for detail navigation. */
export function ResourceDetailScreen<T>(props: ResourceDetailScreenProps<T>): JSX.Element {
  const width = useHydratedWindowWidth();

  return (
    <Screen refreshing={props.refreshing} onRefresh={props.onRefresh} maxWidth={CONTENT_MAX_WIDTH} testID="detail-screen">
      <DetailState props={props} isWide={width >= 900} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  layout: { maxWidth: 760 },
  heading: { gap: spacing.sm },
  kicker: { ...typography.action },
  title: { ...typography.display, fontSize: 34, lineHeight: 36 },
  titleWide: { ...typography.display },
  subtitle: { ...typography.dateline, marginTop: spacing.xs },
  statuses: { gap: spacing.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  actionsStacked: { flexDirection: "column", alignItems: "stretch" },
  footnote: { ...typography.caption, maxWidth: 560 },
});
