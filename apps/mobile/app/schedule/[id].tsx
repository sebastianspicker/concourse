import { useLocalSearchParams } from "expo-router";
import React from "react";
import { useSchedule } from "@/hooks/useSchedule";
import { MetaRow } from "@/ui/MetaRow";
import { ResourceDetailScreen } from "@/ui/ResourceDetailScreen";
import { formatEventDate, formatScheduleTime } from "@/utils/dateFormat";
import { parseRouteItem } from "@/utils/routeItem";
import { ScheduleItemSchema, type ScheduleItem } from "@campus/shared";
import { useLocale } from "@/i18n/LocaleContext";

export default function ScheduleDetailScreen(): JSX.Element {
  const { id, item } = useLocalSearchParams<{ id: string; item?: string }>();
  const { data, loading, error, refreshing, refresh } = useSchedule();
  const routedItem = parseRouteItem<ScheduleItem>(item, ScheduleItemSchema);
  const scheduleItem = data?.schedule.find((entry) => entry.id === id) ?? (routedItem?.id === id ? routedItem : null);
  const { t } = useLocale();

  return (
    <ResourceDetailScreen
      title={t("schedule")}
      loading={loading}
      error={error}
      item={scheduleItem ?? null}
      notFoundMessage={t("errorNotFound")}
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
                  label={t("starts")}
                  value={formatEventDate(scheduleItem.startsAt)}
                />
                <MetaRow
                  label={t("ends")}
                  value={scheduleItem.endsAt ? formatEventDate(scheduleItem.endsAt) : t("toBeAnnounced")}
                />
                <MetaRow label={t("location")} value={scheduleItem.location ?? t("toBeAnnounced")} />
                {scheduleItem.campusId ? (
                  <MetaRow label={t("campus")} value={scheduleItem.campusId} />
                ) : null}
                {scheduleItem.description ? <MetaRow label={t("description")} value={scheduleItem.description} /> : null}
              </>
            )
          : undefined
      }
      refreshing={refreshing}
      onRefresh={refresh}
    />
  );
}
