import { useLocalSearchParams } from "expo-router";
import React from "react";
import { useRooms } from "@/hooks/useRooms";
import { MetaRow } from "@/ui/MetaRow";
import { ResourceDetailScreen } from "@/ui/ResourceDetailScreen";
import { parseRouteItem } from "@/utils/routeItem";
import { RoomSchema, type Room } from "@campus/shared";
import { useLocale } from "@/i18n/LocaleContext";

export default function RoomDetailScreen(): JSX.Element {
  const { id, item } = useLocalSearchParams<{ id: string; item?: string }>();
  const routedRoom = parseRouteItem<Room>(item, RoomSchema);
  const hasRoutedItem = routedRoom?.id === id;
  const { data, loading, error, refreshing, refresh } = useRooms();
  const room = hasRoutedItem ? routedRoom : (data?.rooms.find((entry) => entry.id === id) ?? null);
  const effectiveLoading = hasRoutedItem ? false : loading;
  const { t } = useLocale();

  return (
    <ResourceDetailScreen
      title={t("rooms")}
      loading={effectiveLoading}
      error={error}
      item={room ?? null}
      notFoundMessage={t("errorNotFound")}
      cardTitle={room ? room.name : `Room ID: ${id}`}
      cardSubtitle={room?.campusId}
      renderMeta={
        room
          ? () => (
              <>
                <MetaRow label={t("campus")} value={room.campusId} />
              </>
            )
          : undefined
      }
      refreshing={refreshing}
      onRefresh={refresh}
    />
  );
}
