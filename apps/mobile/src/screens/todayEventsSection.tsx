import React, { useCallback } from "react";
import {
  getEventAccessibilityLabel,
  getEventCard,
  getEventHref
} from "@/screens/todayScreenHelpers";
import { ResourceListSection } from "@/ui/ResourceListSection";
import type { PublicEvent } from "@campus/shared";

export function TodayEventsSection({
  loading,
  error,
  events,
  onRetry
}: {
  loading: boolean;
  error: string | null;
  events: PublicEvent[];
  onRetry: () => void;
}): JSX.Element {
  const keyExtractor = useCallback((event: PublicEvent) => event.id, []);
  const href = useCallback((event: PublicEvent) => getEventHref(event), []);
  const renderCard = useCallback((event: PublicEvent) => getEventCard(event), []);
  const accessibilityLabel = useCallback((event: PublicEvent) => getEventAccessibilityLabel(event), []);

  return (
    <ResourceListSection
      title="Events"
      loading={loading}
      error={error}
      items={events}
      emptyMessage="No public events today."
      emptyHint="Pull down to refresh, or check the Events tab for upcoming events."
      emptyIcon={"📅"}
      keyExtractor={keyExtractor}
      href={href}
      renderCard={renderCard}
      accessibilityLabel={accessibilityLabel}
      onRetry={onRetry}
    />
  );
}
