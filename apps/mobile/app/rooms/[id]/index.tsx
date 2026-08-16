/** Resolves a room route to a detail view and reconciles stale list selection. */
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useRooms } from "@/hooks/useRooms";
import { MetaRow } from "@/ui/MetaRow";
import { ResourceDetailScreen } from "@/ui/ResourceDetailScreen";
import { useLocale } from "@/i18n/LocaleContext";
import { reconcileSelectedDetailRecord, selectDetailRecord, selectedRoomDetails } from "@/data/selectedDetailRecords";
import { formatCampusId } from "@/utils/dateFormat";
import { STATIC_DEMO_ROOM_IDS } from "@/data/staticDemoData";

/** Resolves a selected room into a refreshable, reconciled detail surface. */
export default function RoomDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useRooms();
  const collection = state.data?.rooms ?? null;
  const room = selectDetailRecord(
    id,
    collection,
    state.source,
    selectedRoomDetails.get(id)
  );
  const { t } = useLocale();

  useEffect(() => {
    reconcileSelectedDetailRecord(selectedRoomDetails, id, collection, state.source);
  }, [collection, id, state.source]);

  return (
    <ResourceDetailScreen
      loading={state.loading}
      error={state.error}
      item={room ?? null}
      notFoundMessage={t("errorNotFound")}
      cardTitle={room ? room.name : `Room ID: ${id}`}
      cardSubtitle={room?.campusId ? formatCampusId(room.campusId) : undefined}
      renderMeta={
        room
          ? () => (
              <>
                <MetaRow label={t("campus")} value={formatCampusId(room.campusId)} />
              </>
            )
          : undefined
      }
      cached={state.source === "persisted-cache"}
      cacheAge={state.cacheAge}
      refreshing={state.refreshing}
      onRefresh={state.refresh}
    />
  );
}

/** Pre-renders the sanitized fixture detail routes for static hosting. */
export function generateStaticParams(): Array<{ id: string }> {
  return STATIC_DEMO_ROOM_IDS.map((id) => ({ id }));
}
