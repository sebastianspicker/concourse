import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRooms } from "@/hooks/useRooms";
import { SearchBar } from "@/components/SearchBar";
import {
  getRoomAccessibilityLabel,
  getRoomCard,
  getRoomHref,
  getRoomsEmptyHint,
  getRoomsEmptyMessage
} from "@/screens/roomsScreenHelpers";
import { ResourceListSection } from "@/ui/ResourceListSection";
import { Screen } from "@/ui/Screen";
import { typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import type { Room } from "@campus/shared";

const styles = StyleSheet.create({
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultCount: {
    ...typography.caption,
  },
});

function RoomResultSummary({
  loading,
  resultCount,
  search
}: {
  loading: boolean;
  resultCount: number;
  search: string;
}): JSX.Element | null {
  const theme = useTheme();
  if (loading) return null;

  return (
    <View style={styles.resultRow}>
      <Text style={[styles.resultCount, { color: theme.colors.muted }]}>
        {resultCount} {resultCount === 1 ? "room" : "rooms"}
        {search ? ` for "${search}"` : " available"}
      </Text>
    </View>
  );
}

export default function RoomsScreen(): JSX.Element {
  const [search, setSearch] = useState("");
  const { data, error, loading, refreshing, refresh } = useRooms({ search: search || undefined });
  const rooms = data?.rooms ?? [];

  const keyExtractor = useCallback((r: Room) => r.id, []);
  const href = useCallback((r: Room) => getRoomHref(r), []);
  const renderCard = useCallback((r: Room) => getRoomCard(r), []);
  const accessibilityLabel = useCallback((r: Room) => getRoomAccessibilityLabel(r), []);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search rooms..." />
      <RoomResultSummary loading={loading} resultCount={rooms.length} search={search} />
      <ResourceListSection
        title="Rooms"
        loading={loading}
        error={error}
        items={rooms}
        emptyMessage={getRoomsEmptyMessage(search)}
        emptyHint={getRoomsEmptyHint(search)}
        emptyIcon={"🏢"}
        keyExtractor={keyExtractor}
        href={href}
        renderCard={renderCard}
        accessibilityLabel={accessibilityLabel}
        onRetry={refresh}
      />
    </Screen>
  );
}
