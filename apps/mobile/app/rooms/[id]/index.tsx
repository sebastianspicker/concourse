import { useLocalSearchParams } from "expo-router";
import React from "react";
import { useRooms } from "@/hooks/useRooms";
import { MetaRow } from "@/ui/MetaRow";
import { ResourceDetailScreen } from "@/ui/ResourceDetailScreen";
import { parseRouteItem } from "@/utils/routeItem";
import { RoomSchema, type Room } from "@campus/shared";

export default function RoomDetailScreen(): JSX.Element {
  const { id, item } = useLocalSearchParams<{ id: string; item?: string }>();
  const routedRoom = parseRouteItem<Room>(item, RoomSchema);
  const hasRoutedItem = routedRoom?.id === id;
  const { data, loading, error, refreshing, refresh } = useRooms();
  const room = hasRoutedItem ? routedRoom : (data?.rooms.find((entry) => entry.id === id) ?? null);
  const effectiveLoading = hasRoutedItem ? false : loading;

  return (
    <ResourceDetailScreen
      title="Room Details"
      loading={effectiveLoading}
      error={error}
      item={room ?? null}
      notFoundMessage="Room not found."
      cardTitle={room ? room.name : `Room ID: ${id}`}
      cardSubtitle={room?.campusId}
      renderMeta={
        room
          ? () => (
              <>
                <MetaRow label="Campus" value={room.campusId} />
                <MetaRow label="Availability" value="Private connector required" />
              </>
            )
          : undefined
      }
      footnote="Availability comes from private connectors."
      refreshing={refreshing}
      onRefresh={refresh}
    />
  );
}
