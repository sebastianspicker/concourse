import { StyleSheet, View } from "react-native";
import { EventResultCount } from "@/features/events/eventResultCount";
import { EventSortButton } from "@/features/events/eventSortButton";
import type { SortDirection } from "@/features/events/eventsScreenHelpers";

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
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
