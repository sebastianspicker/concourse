import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRooms } from "@/hooks/useRooms";
import { SearchBar } from "@/components/SearchBar";
import { ResourceListSection } from "@/ui/ResourceListSection";
import { Screen } from "@/ui/Screen";
import { typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import type { Room } from "@campus/shared";

export default function RoomsScreen(): JSX.Element {
  const [search, setSearch] = useState("");
  const { data, error, loading, refreshing, refresh } = useRooms({ search: search || undefined });
  const theme = useTheme();
  const rooms = data?.rooms ?? [];

  const keyExtractor = useCallback((r: Room) => r.id, []);
  const href = useCallback(
    (r: Room) => ({ pathname: "/rooms/[id]" as const, params: { id: r.id } }),
    []
  );
  const renderCard = useCallback(
    (r: Room) => ({
      title: r.name,
      subtitle: r.campusId ? `Campus ${r.campusId}` : undefined,
    }),
    []
  );
  const accessibilityLabel = useCallback(
    (r: Room) => `${r.name}. ${r.campusId ? `Campus ${r.campusId}.` : ""}`,
    []
  );

  const resultCount = rooms.length;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search rooms..."
      />
      {!loading ? (
        <View style={styles.resultRow}>
          <Text style={[styles.resultCount, { color: theme.colors.muted }]}>
            {resultCount} {resultCount === 1 ? "room" : "rooms"}
            {search ? ` for "${search}"` : " available"}
          </Text>
        </View>
      ) : null}
      <ResourceListSection
        title="Rooms"
        loading={loading}
        error={error}
        items={rooms}
        emptyMessage={search ? `No rooms matching "${search}"` : "No rooms available yet."}
        emptyHint={search ? "Try a different search term or clear your search." : "Room data is loaded from the institution config."}
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

const styles = StyleSheet.create({
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultCount: {
    ...typography.caption,
  },
});
