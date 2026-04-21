import { useLocalSearchParams } from "expo-router";
import React from "react";
import { useSchedule } from "@/hooks/useSchedule";
import { MetaRow } from "@/ui/MetaRow";
import { ResourceDetailScreen } from "@/ui/ResourceDetailScreen";
import { formatEventDate, formatScheduleTime } from "@/utils/dateFormat";

export default function ScheduleDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, refreshing, refresh } = useSchedule();
  const item = data?.schedule.find((entry) => entry.id === id);

  return (
    <ResourceDetailScreen
      title="Schedule Entry"
      loading={loading}
      error={error}
      item={item ?? null}
      notFoundMessage="Schedule entry not found."
      cardTitle={item ? item.title : "Schedule item"}
      cardSubtitle={
        item
          ? formatScheduleTime(item.startsAt)
          : `Schedule ID: ${id}`
      }
      renderMeta={
        item
          ? () => (
              <>
                <MetaRow
                  label="Starts"
                  value={formatEventDate(item.startsAt)}
                />
                <MetaRow
                  label="Ends"
                  value={item.endsAt ? formatEventDate(item.endsAt) : "TBA"}
                />
                <MetaRow label="Location" value={item.location ?? "TBA"} />
                {item.campusId ? (
                  <MetaRow label="Campus" value={item.campusId} />
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
