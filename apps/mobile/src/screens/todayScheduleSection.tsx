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
  error: string | null;
  items: ScheduleItem[];
  onRetry: () => void;
}): JSX.Element {
  const keyExtractor = useCallback((item: ScheduleItem) => item.id, []);
  const href = useCallback((item: ScheduleItem) => getScheduleHref(item), []);
  const renderCard = useCallback((item: ScheduleItem) => getScheduleCard(item), []);
  const accessibilityLabel = useCallback((item: ScheduleItem) => getScheduleAccessibilityLabel(item), []);

  return (
    <>
      <ScheduleSortHeader sortDirection={sortDirection} onToggleSort={onToggleSort} />
      <ResourceListSection
        title="Schedule"
        loading={loading}
        error={error}
        items={items}
        emptyMessage="No classes scheduled today."
        emptyHint="Your schedule will appear here once a public calendar feed is configured."
        emptyIcon={"📋"}
        keyExtractor={keyExtractor}
        href={href}
        renderCard={renderCard}
        accessibilityLabel={accessibilityLabel}
        onRetry={onRetry}
      />
    </>
  );
}
