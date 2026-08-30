import { useCallback } from "react";
import {
  getScheduleAccessibilityLabel,
  getScheduleCard,
  getCurrentOrNextScheduleId,
  getScheduleHref,
  type SortDirection
} from "@/features/today/todayScreenHelpers";
import { ScheduleSortHeader } from "@/features/today/scheduleSortHeader";
import { ResourceListSection } from "@/design-system/ResourceListSection";
import type { ScheduleItem } from "@concourse/contracts";
import type { UiError } from "@/platform/http/uiError";
import { useLocale } from "@/localization/LocaleContext";
import { getInstitutionTimeZone } from "@/platform/env/institution";
import { selectedScheduleDetails, type DetailSource } from "@/data/public/selectedDetailRecords";

export function ScheduleSection({
  sortDirection,
  onToggleSort,
  loading,
  error,
  items,
  source,
  isWide,
  onRetry
}: {
  sortDirection: SortDirection;
  onToggleSort: () => void;
  loading: boolean;
  error: UiError | null;
  items: ScheduleItem[];
  source: DetailSource;
  isWide: boolean;
  onRetry: () => void;
}): JSX.Element {
  const { locale, t } = useLocale();
  const timeZone = getInstitutionTimeZone();
  const keyExtractor = useCallback((item: ScheduleItem) => item.id, []);
  const href = useCallback((item: ScheduleItem) => getScheduleHref(item), []);
  const renderCard = useCallback((item: ScheduleItem) => getScheduleCard(item, locale, timeZone, t("toBeAnnounced")), [locale, t, timeZone]);
  const accessibilityLabel = useCallback((item: ScheduleItem) => getScheduleAccessibilityLabel(item, locale, timeZone, t("location"), t("toBeAnnounced")), [locale, t, timeZone]);
  const onNavigate = useCallback((item: ScheduleItem) => {
    selectedScheduleDetails.remember(item, { authoritative: source === "network" });
  }, [source]);

  return (
    <ResourceListSection
      title={t("schedule")}
      action={<ScheduleSortHeader sortDirection={sortDirection} onToggleSort={onToggleSort} inline={isWide} />}
      loading={loading}
      error={error}
      items={items}
      emptyMessage={t("noSchedule")}
      emptyHint={t("scheduleEmptyHint")}
      keyExtractor={keyExtractor}
      href={href}
      renderCard={renderCard}
      accessibilityLabel={accessibilityLabel}
      onNavigate={onNavigate}
      onRetry={onRetry}
      variant="timeline"
      activeItemId={getCurrentOrNextScheduleId(items)}
      rowMinHeight={isWide ? 96 : undefined}
      openRows={isWide}
      prominentTitle={isWide}
    />
  );
}
