/** Virtualizes resource collections while preserving loading, empty, and recoverable-error states. */
import React, { useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";
import type { UiError } from "@/platform/http/uiError";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { ResourceListItem, type ResourceListContent, type ResourceListItemVariant } from "./ResourceListItem";
import { SkeletonList } from "./Skeleton";
import { spacing } from "./theme";
import { useTheme } from "./ThemeContext";

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
  activeItemId?: string;
  emptyMessage: string;
  emptyHint?: string;
  header?: React.ReactElement;
  testID?: string;
};

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
  activeItemId,
  emptyMessage,
  emptyHint,
  header,
  testID,
}: ResourceListProps<T>): JSX.Element {
  const theme = useTheme();
  const renderItem = useCallback(({ item, index }: { item: T; index: number }) => {
    const id = keyExtractor(item);
    return (
      <ResourceListItem
        item={item}
        href={href}
        renderCard={renderCard}
        accessibilityLabel={accessibilityLabel}
        onNavigate={onNavigate}
        variant={variant}
        active={id === activeItemId}
        isFirst={index === 0}
        isLast={index === items.length - 1}
      />
    );
  }, [accessibilityLabel, activeItemId, href, items.length, keyExtractor, onNavigate, renderCard, variant]);

  const empty = loading
    ? <SkeletonList count={6} />
    : error
      ? <ErrorState error={error} onRetry={onRefresh} />
      : <EmptyState message={emptyMessage} hint={emptyHint} />;

  return (
    <FlatList
      testID={testID}
      data={loading || error ? [] : items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl * 2, flexGrow: 1 },
});
