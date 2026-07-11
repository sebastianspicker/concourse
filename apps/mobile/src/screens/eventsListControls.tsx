import React from "react";
import { StyleSheet, View } from "react-native";
import { EventResultCount } from "@/screens/eventResultCount";
import { EventSortButton } from "@/screens/eventSortButton";
import type { SortDirection } from "@/screens/eventsScreenHelpers";

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export function EventListControls({
  loading,
  resultCount,
  search,
  sortDirection,
  onToggleSort,
}: {
  loading: boolean;
  resultCount: number;
  search: string;
  sortDirection: SortDirection;
  onToggleSort: () => void;
}): JSX.Element {
  return (
    <View style={styles.controls}>
      <EventResultCount loading={loading} resultCount={resultCount} search={search} />
      <EventSortButton sortDirection={sortDirection} onToggleSort={onToggleSort} />
    </View>
  );
}
