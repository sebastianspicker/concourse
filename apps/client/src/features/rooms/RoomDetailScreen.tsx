/** Resolves a room route to a detail view and reconciles stale list selection. */
import { useLocalSearchParams } from "expo-router";
import { useRooms } from "@/data/public/resources";
import { MetaRow } from "@/design-system/MetaRow";
import { ResourceDetailScreen } from "@/design-system/ResourceDetailScreen";
import { useLocale } from "@/localization/LocaleContext";
import { selectedRoomDetails, useSelectedDetail } from "@/data/public/selectedDetailRecords";
import { formatCampusId } from "@/localization/dateFormat";
import { STATIC_DEMO_ROOM_IDS } from "@/data/public/staticDemoData";

/** Resolves a selected room into a refreshable, reconciled detail surface. */
export default function RoomDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useRooms();
  const collection = state.data?.rooms ?? null;
  const room = useSelectedDetail(selectedRoomDetails, id, collection, state.source);
  const { t } = useLocale();

  return (
    <ResourceDetailScreen
      loading={state.loading}
      error={state.error}
      item={room ?? null}
      notFoundMessage={t("errorNotFound")}
      kicker={t("kickerRoom")}
      cardTitle={room ? room.name : t("unknownRoom", { id: String(id) })}
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
