import { useLocalSearchParams } from "expo-router";
import React from "react";
import { useRooms } from "@/hooks/useRooms";
import { MetaRow } from "@/ui/MetaRow";
import { ResourceDetailScreen } from "@/ui/ResourceDetailScreen";

export default function RoomDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, refreshing, refresh } = useRooms();
  const room = data?.rooms.find((entry) => entry.id === id);

  return (
    <ResourceDetailScreen
      title="Room Details"
      loading={loading}
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
