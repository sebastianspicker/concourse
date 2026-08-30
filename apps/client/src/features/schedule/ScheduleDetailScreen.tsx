/** Resolves a schedule route to a time-zone-aware detail view and reconciles selection. */
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useSchedule } from "@/data/public/useSchedule";
import { MetaRow } from "@/design-system/MetaRow";
import { ResourceDetailScreen } from "@/design-system/ResourceDetailScreen";
import { formatCampusId, formatEventDate, formatScheduleTime } from "@/localization/dateFormat";
import { useLocale } from "@/localization/LocaleContext";
import { getInstitutionTimeZone } from "@/platform/env/institution";
import { reconcileSelectedDetailRecord, selectDetailRecord, selectedScheduleDetails } from "@/data/public/selectedDetailRecords";
import { STATIC_DEMO_SCHEDULE_IDS } from "@/data/public/staticDemoData";

/** Resolves a selected schedule entry into a campus-time-aware detail surface. */
export default function ScheduleDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useSchedule();
  const collection = state.data?.schedule ?? null;
  const scheduleItem = selectDetailRecord(
    id,
    collection,
    state.source,
    selectedScheduleDetails.get(id),
    state.data?._degraded === true
  );
  const { locale, t } = useLocale();
  const timeZone = getInstitutionTimeZone();

  useEffect(() => {
    reconcileSelectedDetailRecord(selectedScheduleDetails, id, collection, state.source, state.data?._degraded === true);
  }, [collection, id, state.data?._degraded, state.source]);

  return (
    <ResourceDetailScreen
      loading={state.loading}
      error={state.error}
      item={scheduleItem ?? null}
      notFoundMessage={t("errorNotFound")}
      cardTitle={scheduleItem ? scheduleItem.title : "Schedule item"}
      cardSubtitle={
        scheduleItem
          ? formatScheduleTime(scheduleItem.startsAt, locale, timeZone)
          : `Schedule ID: ${id}`
      }
      renderMeta={
        scheduleItem
          ? () => (
              <>
                <MetaRow
                  label={t("starts")}
                  value={formatEventDate(scheduleItem.startsAt, locale, timeZone)}
                />
                <MetaRow
                  label={t("ends")}
                  value={scheduleItem.endsAt ? formatEventDate(scheduleItem.endsAt, locale, timeZone) : t("toBeAnnounced")}
                />
                <MetaRow label={t("location")} value={scheduleItem.location ?? t("toBeAnnounced")} />
                {scheduleItem.campusId ? (
                  <MetaRow label={t("campus")} value={formatCampusId(scheduleItem.campusId)} />
                ) : null}
                {scheduleItem.description ? <MetaRow label={t("description")} value={scheduleItem.description} /> : null}
              </>
            )
          : undefined
      }
      cached={state.source === "persisted-cache"}
      cacheAge={state.cacheAge}
      degraded={state.data?._degraded === true}
      refreshing={state.refreshing}
      onRefresh={state.refresh}
    />
  );
}

/** Pre-renders the sanitized fixture detail routes for static hosting. */
export function generateStaticParams(): Array<{ id: string }> {
  return STATIC_DEMO_SCHEDULE_IDS.map((id) => ({ id }));
}
