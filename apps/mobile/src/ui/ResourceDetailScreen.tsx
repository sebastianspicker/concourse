import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { UiError } from "../api/uiError";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { Screen } from "./Screen";
import { SkeletonDetail } from "./Skeleton";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

export type ResourceDetailScreenProps<T> = {
  title: string;
  loading: boolean;
  error: UiError | string | null;
  item: T | null;
  notFoundMessage: string;
  cardTitle: string;
  cardSubtitle?: string;
  renderMeta?: () => React.ReactNode;
  footnote?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function ResourceDetailScreen<T>(props: ResourceDetailScreenProps<T>): JSX.Element {
  const { loading, error, item, notFoundMessage, cardTitle, cardSubtitle, renderMeta, footnote, refreshing, onRefresh } = props;
  const theme = useTheme();

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} maxWidth={760} testID="detail-screen">
      {loading ? <SkeletonDetail /> : error ? (
        <ErrorState {...(typeof error === "string" ? { message: error } : { error })} onRetry={onRefresh} />
      ) : !item ? (
        <EmptyState message={notFoundMessage} hint="This information may have been removed or the link may be outdated." />
      ) : (
        <View style={styles.layout}>
          <View style={[styles.heading, { borderBottomColor: theme.colors.border }]}>
            <Text selectable accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{cardTitle}</Text>
            {cardSubtitle ? <Text selectable style={[styles.subtitle, { color: theme.colors.muted }]}>{cardSubtitle}</Text> : null}
          </View>
          {renderMeta ? <View style={[styles.meta, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>{renderMeta()}</View> : null}
          {footnote ? <Text selectable style={[styles.footnote, { color: theme.colors.muted }]}>{footnote}</Text> : null}
        </View>
      )}
    </Screen>
  );
}

export const DetailLayout = ResourceDetailScreen;

const styles = StyleSheet.create({
  layout: { gap: spacing.lg },
  heading: { gap: spacing.xs, paddingBottom: spacing.lg, borderBottomWidth: 1 },
  title: { ...typography.heading },
  subtitle: { ...typography.body },
  meta: { borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.md },
  footnote: { ...typography.caption, maxWidth: 560 },
});
