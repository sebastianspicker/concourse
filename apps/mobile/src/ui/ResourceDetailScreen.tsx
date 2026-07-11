import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { detectResourceErrorType } from "./resourceErrorType";
import { Screen } from "./Screen";
import { Section } from "./Section";
import { SkeletonDetail } from "./Skeleton";
import { scaled, scaledFont, scaledRadius, spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

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

export function ResourceDetailScreen<T>(props: ResourceDetailScreenProps<T>): JSX.Element {
  const { title, refreshing, onRefresh } = props;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Section title={title}>
        <ResourceDetailContent {...props} />
      </Section>
    </Screen>
  );
}

function ResourceDetailContent<T>(props: ResourceDetailScreenProps<T>): JSX.Element {
  const {
    loading,
    error,
    item,
    notFoundMessage,
    cardTitle,
    cardSubtitle,
    renderMeta,
    footnote,
    onRefresh
  } = props;
  if (loading) {
    return <SkeletonDetail />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        errorType={detectResourceErrorType(error)}
        onRetry={onRefresh}
      />
    );
  }

  if (!item) {
    return (
      <EmptyState
        message={notFoundMessage}
        icon="🔍"
        hint="This item may have been removed or the link may be outdated."
      />
    );
  }

  return (
    <>
      <Card title={cardTitle} subtitle={cardSubtitle} />
      {renderMeta ? <MetaCard>{renderMeta()}</MetaCard> : null}
      {footnote ? <DetailFootnote>{footnote}</DetailFootnote> : null}
    </>
  );
}

function MetaCard({ children }: { children: React.ReactNode }): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
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
      {children}
    </View>
  );
}

function DetailFootnote({ children }: { children: string }): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
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
      {children}
    </Text>
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
