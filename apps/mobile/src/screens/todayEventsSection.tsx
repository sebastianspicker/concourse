import React, { useCallback } from "react";
import {
  getEventAccessibilityLabel,
  getEventCard,
  getEventHref
} from "@/screens/todayScreenHelpers";
import { ResourceListSection } from "@/ui/ResourceListSection";
import type { PublicEvent } from "@campus/shared";
import type { UiError } from "@/api/uiError";
import { useLocale } from "@/i18n/LocaleContext";

export function TodayEventsSection({
  loading,
  error,
  events,
  onRetry
}: {
  loading: boolean;
  error: UiError | null;
  events: PublicEvent[];
  onRetry: () => void;
}): JSX.Element {
  const { t } = useLocale();
  const keyExtractor = useCallback((event: PublicEvent) => event.id, []);
  const href = useCallback((event: PublicEvent) => getEventHref(event), []);
  const renderCard = useCallback((event: PublicEvent) => getEventCard(event), []);
  const accessibilityLabel = useCallback((event: PublicEvent) => getEventAccessibilityLabel(event), []);

  return (
    <ResourceListSection
      title={t("events")}
      loading={loading}
      error={error}
      items={events}
      emptyMessage={t("noEvents")}
      emptyHint="Pull down to refresh, or check the Events tab for upcoming events."
      keyExtractor={keyExtractor}
      href={href}
      renderCard={renderCard}
      accessibilityLabel={accessibilityLabel}
      onRetry={onRetry}
    />
  );
}
