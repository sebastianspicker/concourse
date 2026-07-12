import React, { useCallback } from "react";
import {
  getScheduleAccessibilityLabel,
  getScheduleCard,
  getScheduleHref
} from "@/screens/todayScreenHelpers";
import type { SortDirection } from "@/screens/todayScreenHelpers";
import { ScheduleSortHeader } from "@/screens/scheduleSortHeader";
import { ResourceListSection } from "@/ui/ResourceListSection";
import type { ScheduleItem } from "@campus/shared";
import type { UiError } from "@/api/uiError";
import { useLocale } from "@/i18n/LocaleContext";

export function ScheduleSection({
  sortDirection,
  onToggleSort,
  loading,
  error,
  items,
  onRetry
}: {
  sortDirection: SortDirection;
  onToggleSort: () => void;
  loading: boolean;
  error: UiError | null;
  items: ScheduleItem[];
  onRetry: () => void;
}): JSX.Element {
  const { t } = useLocale();
  const keyExtractor = useCallback((item: ScheduleItem) => item.id, []);
  const href = useCallback((item: ScheduleItem) => getScheduleHref(item), []);
  const renderCard = useCallback((item: ScheduleItem) => getScheduleCard(item), []);
  const accessibilityLabel = useCallback((item: ScheduleItem) => getScheduleAccessibilityLabel(item), []);

  return (
    <>
      <ScheduleSortHeader sortDirection={sortDirection} onToggleSort={onToggleSort} />
      <ResourceListSection
        title={t("schedule")}
        loading={loading}
        error={error}
        items={items}
        emptyMessage={t("noSchedule")}
        emptyHint="Your schedule will appear here once a public calendar feed is configured."
        keyExtractor={keyExtractor}
        href={href}
        renderCard={renderCard}
        accessibilityLabel={accessibilityLabel}
        onRetry={onRetry}
      />
    </>
  );
}
