/** Resolves a schedule route to a time-zone-aware detail view and reconciles selection. */
import { useLocalSearchParams } from "expo-router";
import { useSchedule } from "@/data/public/resources";
import { MetaRow } from "@/design-system/MetaRow";
import { ResourceDetailScreen } from "@/design-system/ResourceDetailScreen";
import { formatBoardDay, formatBoardTime, formatBoardTimeRange, formatCampusId, formatLongDate } from "@/localization/dateFormat";
import { useLocale } from "@/localization/LocaleContext";
import { getInstitutionTimeZone } from "@/platform/env/institution";
import { selectedScheduleDetails, useSelectedDetail } from "@/data/public/selectedDetailRecords";
import { STATIC_DEMO_SCHEDULE_IDS } from "@/data/public/staticDemoData";

/** Resolves a selected schedule entry into a campus-time-aware detail surface. */
export default function ScheduleDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useSchedule();
  const collection = state.data?.schedule ?? null;
  const scheduleItem = useSelectedDetail(selectedScheduleDetails, id, collection, state.source, state.data?._degraded === true);
  const { locale, t } = useLocale();
  const timeZone = getInstitutionTimeZone();

  return (
    <ResourceDetailScreen
      loading={state.loading}
      error={state.error}
      item={scheduleItem ?? null}
      notFoundMessage={t("errorNotFound")}
      kicker={t("kickerSchedule")}
      cardTitle={scheduleItem ? scheduleItem.title : t("unknownScheduleEntry", { id: String(id) })}
      cardSubtitle={
        scheduleItem
          ? `${formatBoardDay(scheduleItem.startsAt, locale, timeZone).weekday} ${formatBoardTimeRange(scheduleItem.startsAt, scheduleItem.endsAt, locale, timeZone)}`
          : undefined
      }
      renderMeta={
        scheduleItem
          ? () => (
              <>
                <MetaRow label={t("date")} value={formatLongDate(scheduleItem.startsAt, locale, timeZone)} data />
                <MetaRow label={t("starts")} value={formatBoardTime(scheduleItem.startsAt, locale, timeZone)} data />
                <MetaRow
                  label={t("ends")}
                  value={scheduleItem.endsAt ? formatBoardTime(scheduleItem.endsAt, locale, timeZone) : t("toBeAnnounced")}
                  data={Boolean(scheduleItem.endsAt)}
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
