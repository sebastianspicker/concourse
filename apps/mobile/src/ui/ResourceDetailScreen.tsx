import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import type { ErrorType } from "./ErrorState";
import { Screen } from "./Screen";
import { Section } from "./Section";
import { SkeletonDetail } from "./Skeleton";
import { scaled, scaledFont, scaledRadius, spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

function detectErrorType(error: string): ErrorType {
  const lower = error.toLowerCase();
  if (
    lower.includes("network") ||
    lower.includes("connection") ||
    lower.includes("offline") ||
    lower.includes("timeout") ||
    lower.includes("fetch") ||
    lower.includes("request failed")
  ) {
    return "network";
  }
  if (lower.includes("not found") || lower.includes("404")) {
    return "notFound";
  }
  return "generic";
}

export type ResourceDetailScreenProps<T> = {
  title: string;
  loading: boolean;
  error: string | null;
  item: T | null;
  notFoundMessage: string;
  cardTitle: string;
  cardSubtitle?: string;
  renderMeta?: () => React.ReactNode;
  footnote?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function ResourceDetailScreen<T>({
  title,
  loading,
  error,
  item,
  notFoundMessage,
  cardTitle,
  cardSubtitle,
  renderMeta,
  footnote,
  refreshing,
  onRefresh
}: ResourceDetailScreenProps<T>): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Section title={title}>
        {loading ? <SkeletonDetail /> : null}
        {!loading && error ? (
          <ErrorState
            message={error}
            errorType={detectErrorType(error)}
            onRetry={onRefresh}
          />
        ) : null}
        {!loading && !error && item ? (
          <>
            <Card title={cardTitle} subtitle={cardSubtitle} />
            {renderMeta ? (
              <View
                style={[
                  styles.metaCard,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    borderWidth: ui.borderWidth,
                    borderRadius: scaledRadius(16, ui),
                    padding: scaled(spacing.md, ui),
                  },
                ]}
              >
                {renderMeta()}
              </View>
            ) : null}
          </>
        ) : null}
        {!loading && !error && !item ? (
          <EmptyState
            message={notFoundMessage}
            icon="🔍"
            hint="This item may have been removed or the link may be outdated."
          />
        ) : null}
        {footnote && !loading ? (
          <Text
            selectable
            style={[
              styles.muted,
              {
                color: theme.colors.muted,
                fontSize: scaledFont(typography.caption.fontSize, ui),
                lineHeight: scaledFont(typography.caption.lineHeight, ui),
              },
            ]}
          >
            {footnote}
          </Text>
        ) : null}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: {
    ...typography.caption,
  },
  metaCard: {
    borderCurve: "continuous",
  },
});
