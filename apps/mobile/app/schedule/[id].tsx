import { useLocalSearchParams } from "expo-router";
import React from "react";
import { useSchedule } from "@/hooks/useSchedule";
import { MetaRow } from "@/ui/MetaRow";
import { ResourceDetailScreen } from "@/ui/ResourceDetailScreen";
import { formatEventDate, formatScheduleTime } from "@/utils/dateFormat";
import { parseRouteItem } from "@/utils/routeItem";
import { ScheduleItemSchema, type ScheduleItem } from "@campus/shared";

export default function ScheduleDetailScreen(): JSX.Element {
  const { id, item } = useLocalSearchParams<{ id: string; item?: string }>();
  const { data, loading, error, refreshing, refresh } = useSchedule();
  const routedItem = parseRouteItem<ScheduleItem>(item, ScheduleItemSchema);
  const scheduleItem = data?.schedule.find((entry) => entry.id === id) ?? (routedItem?.id === id ? routedItem : null);

  return (
    <ResourceDetailScreen
      title="Schedule Entry"
      loading={loading}
      error={error}
      item={scheduleItem ?? null}
      notFoundMessage="Schedule entry not found."
      cardTitle={scheduleItem ? scheduleItem.title : "Schedule item"}
      cardSubtitle={
        scheduleItem
          ? formatScheduleTime(scheduleItem.startsAt)
          : `Schedule ID: ${id}`
      }
      renderMeta={
        scheduleItem
          ? () => (
              <>
                <MetaRow
                  label="Starts"
                  value={formatEventDate(scheduleItem.startsAt)}
                />
                <MetaRow
                  label="Ends"
                  value={scheduleItem.endsAt ? formatEventDate(scheduleItem.endsAt) : "TBA"}
                />
                <MetaRow label="Location" value={scheduleItem.location ?? "TBA"} />
                {scheduleItem.campusId ? (
                  <MetaRow label="Campus" value={scheduleItem.campusId} />
                ) : null}
              </>
            )
          : undefined
      }
      footnote="Connect a private schedule feed to enrich this view."
      refreshing={refreshing}
      onRefresh={refresh}
    />
  );
}
