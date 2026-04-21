import { FlashList } from "@shopify/flash-list";
import React from "react";
import { StyleSheet, Text } from "react-native";

type FlashListProps<T> = React.ComponentProps<typeof FlashList<T>>;
type FlashListRenderItem<T> = NonNullable<FlashListProps<T>["renderItem"]>;
type FlashListContentStyle = NonNullable<FlashListProps<unknown>["contentContainerStyle"]>;

const DEFAULT_ESTIMATED_ITEM_SIZE = 72;

export function VirtualizedList<T>({
  data,
  renderItem,
  keyExtractor,
  contentContainerStyle,
  emptyText,
  estimatedItemSize = DEFAULT_ESTIMATED_ITEM_SIZE
}: {
  data: readonly T[];
  renderItem: FlashListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  contentContainerStyle?: FlashListContentStyle;
  emptyText?: string;
  estimatedItemSize?: number;
}): JSX.Element {
  return (
    <FlashList
      data={data as T[]}
      renderItem={renderItem}
      keyExtractor={(item: T, index: number) => keyExtractor(item, index)}
      estimatedItemSize={estimatedItemSize}
      contentContainerStyle={contentContainerStyle}
      ListEmptyComponent={
        emptyText != null && emptyText !== "" ? (
          <Text style={styles.empty}>{emptyText}</Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: 12,
    opacity: 0.7
  }
});
