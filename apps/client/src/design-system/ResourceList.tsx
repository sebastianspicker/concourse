/** Renders resource collections, virtualized or sectioned, with shared loading, empty, and recoverable-error states. */
import React, { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import type { UiError } from "@/platform/http/uiError";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { ResourceListItem, type ResourceListContent, type ResourceListItemVariant } from "./ResourceListItem";
import { Section } from "./Section";
import { SkeletonList } from "./Skeleton";
import { spacing } from "./theme";
import { useHydratedWindowWidth } from "./useHydratedWindowWidth";

export type ResourceListProps<T> = {
  items: T[];
  loading: boolean;
  error: UiError | null;
  refreshing: boolean;
  onRefresh: () => void;
  keyExtractor: (item: T) => string;
  href: (item: T) => { pathname: string; params: Record<string, string> };
  renderCard: (item: T) => ResourceListContent;
  accessibilityLabel: (item: T) => string;
  onNavigate?: (item: T) => void;
  variant?: ResourceListItemVariant;
  emptyMessage: string;
  emptyHint?: string;
  header?: React.ReactElement;
  testID?: string;
};

type ResourceListStatusProps = {
  loading: boolean;
  error: UiError | null;
  onRetry?: () => void;
  emptyMessage: string;
  emptyHint?: string;
  variant: ResourceListItemVariant;
  count: number;
};

/** Selects the loading, failure, or empty placeholder shared by list and section layouts. */
function ResourceListStatus({
  loading,
  error,
  onRetry,
  emptyMessage,
  emptyHint,
  variant,
  count,
}: ResourceListStatusProps): JSX.Element {
  if (loading) return <SkeletonList count={count} variant={variant} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  return <EmptyState message={emptyMessage} hint={emptyHint} />;
}

/** Virtualized resource list that preserves loading, empty, and recoverable-error semantics. */
export function ResourceList<T>({
  items,
  loading,
  error,
  refreshing,
  onRefresh,
  keyExtractor,
  href,
  renderCard,
  accessibilityLabel,
  onNavigate,
  variant = "standard",
  emptyMessage,
  emptyHint,
  header,
  testID,
}: ResourceListProps<T>): JSX.Element {
  const columns = useCardColumns(variant === "card");
  const renderItem = useCallback(({ item }: { item: T }) => (
    <View style={columns > 1 ? [styles.cell, { width: `${100 / columns}%` }] : variant === "card" && styles.cardStack}>
      <ResourceListItem
        item={item}
        href={href}
        renderCard={renderCard}
        accessibilityLabel={accessibilityLabel}
        onNavigate={onNavigate}
        variant={variant}
      />
    </View>
  ), [accessibilityLabel, columns, href, onNavigate, renderCard, variant]);

  const empty = (
    <ResourceListStatus
      loading={loading}
      error={error}
      onRetry={onRefresh}
      emptyMessage={emptyMessage}
      emptyHint={emptyHint}
      variant={variant}
      count={6}
    />
  );

  return (
    <FlatList
      key={columns}
      numColumns={columns}
      columnWrapperStyle={columns > 1 ? styles.columns : undefined}
      testID={testID}
      data={loading || error ? [] : items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      initialNumToRender={12}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

export type ResourceListSectionProps<T> = {
  title: string;
  meta?: string;
  loading: boolean;
  error: UiError | null;
  items: T[];
  emptyMessage: string;
  keyExtractor: (item: T) => string;
  href: (item: T) => { pathname: string; params: Record<string, string> };
  renderCard: (item: T) => ResourceListContent;
  accessibilityLabel: (item: T) => string;
  onNavigate?: (item: T) => void;
  variant?: ResourceListItemVariant;
  action?: React.ReactNode;
  onRetry?: () => void;
  emptyHint?: string;
  rowMinHeight?: number;
};

/** Wraps a resource collection in a labeled section with optional header action. */
export function ResourceListSection<T>(props: ResourceListSectionProps<T>): JSX.Element {
  const { title, meta, action, loading, error } = props;

  return (
    <Section title={title} meta={loading || error ? undefined : meta} action={action}>
      <ResourceListSectionItems {...props} />
    </Section>
  );
}

/** Selects loading, failure, empty, or populated resource-list content from request state. */
function ResourceListSectionItems<T>(props: ResourceListSectionProps<T>): JSX.Element {
  const { loading, error, items, emptyMessage, keyExtractor, href, renderCard, accessibilityLabel, onNavigate, onRetry, emptyHint, variant = "standard", rowMinHeight } = props;
  if (loading || error || items.length === 0) {
    return (
      <ResourceListStatus
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage={emptyMessage}
        emptyHint={emptyHint}
        variant={variant}
        count={3}
      />
    );
  }

  return (
    <ItemGrid cards={variant === "card"}>
      {items.map((item) => (
        <ResourceListItem
          key={keyExtractor(item)}
          item={item}
          href={href}
          renderCard={renderCard}
          accessibilityLabel={accessibilityLabel}
          onNavigate={onNavigate}
          variant={variant}
          minHeight={rowMinHeight}
        />
      ))}
    </ItemGrid>
  );
}

/** Cards sit three, two, or one to a row by width; rows always stack. */
function useCardColumns(cards: boolean): number {
  const width = useHydratedWindowWidth();
  if (!cards) return 1;
  return width >= 1100 ? 3 : width >= 700 ? 2 : 1;
}

/** Stacks rows, or lays cards out in a grid. */
function ItemGrid({ cards, children }: { cards: boolean; children: React.ReactNode[] }): JSX.Element {
  const columns = useCardColumns(cards);
  if (!cards) return <View>{children}</View>;
  return (
    <View style={styles.grid}>
      {children.map((child, index) => (
        <View key={index} style={[styles.cell, { width: `${100 / columns}%` }]}>{child}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, flexGrow: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.sm },
  cell: { paddingHorizontal: spacing.sm, paddingBottom: spacing.lg },
  columns: { marginHorizontal: -spacing.sm },
  cardStack: { paddingBottom: spacing.lg },
});
