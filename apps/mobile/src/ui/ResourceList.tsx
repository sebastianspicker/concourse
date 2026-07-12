import React, { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import type { UiError } from "../api/uiError";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { ResourceListItem } from "./ResourceListItem";
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
  renderCard: (item: T) => { title: string; subtitle?: string };
  accessibilityLabel: (item: T) => string;
  emptyMessage: string;
  emptyHint?: string;
  header?: React.ReactElement;
  testID?: string;
};

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
  emptyMessage,
  emptyHint,
  header,
  testID,
}: ResourceListProps<T>): JSX.Element {
  const theme = useTheme();
  const renderItem = useCallback(({ item }: { item: T }) => (
    <ResourceListItem item={item} href={href} renderCard={renderCard} accessibilityLabel={accessibilityLabel} />
  ), [accessibilityLabel, href, renderCard]);

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
      ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />}
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
  content: { paddingBottom: spacing.xxl, flexGrow: 1 },
  separator: { height: StyleSheet.hairlineWidth },
});
