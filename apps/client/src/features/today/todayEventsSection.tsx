import { useCallback } from "react";
import {
  getEventAccessibilityLabel,
  getEventCard,
  getEventHref
} from "@/features/today/todayScreenHelpers";
import { ResourceListSection } from "@/design-system/ResourceListSection";
import type { PublicEvent } from "@concourse/contracts";
import type { UiError } from "@/platform/http/uiError";
import { useLocale } from "@/localization/LocaleContext";
import { getInstitutionTimeZone } from "@/platform/env/institution";
import { selectedEventDetails, type DetailSource } from "@/data/public/selectedDetailRecords";

export function TodayEventsSection({
  loading,
  error,
  events,
  source,
  isWide,
  onRetry
}: {
  loading: boolean;
  error: UiError | null;
  events: PublicEvent[];
  source: DetailSource;
  isWide: boolean;
  onRetry: () => void;
}): JSX.Element {
  const { locale, t } = useLocale();
  const timeZone = getInstitutionTimeZone();
  const keyExtractor = useCallback((event: PublicEvent) => event.id, []);
  const href = useCallback((event: PublicEvent) => getEventHref(event), []);
  const renderCard = useCallback((event: PublicEvent) => getEventCard(event, locale, timeZone), [locale, timeZone]);
  const accessibilityLabel = useCallback((event: PublicEvent) => getEventAccessibilityLabel(event, locale, timeZone), [locale, timeZone]);
  const onNavigate = useCallback((event: PublicEvent) => {
    selectedEventDetails.remember(event, { authoritative: source === "network" });
  }, [source]);

  return (
    <ResourceListSection
      title={t("events")}
      loading={loading}
      error={error}
      items={events}
      emptyMessage={t("noEvents")}
      emptyHint={t("eventsEmptyHint")}
      keyExtractor={keyExtractor}
      href={href}
      renderCard={renderCard}
      accessibilityLabel={accessibilityLabel}
      onNavigate={onNavigate}
      onRetry={onRetry}
      variant="route"
      activeItemId={events[0]?.id}
      rowMinHeight={isWide ? 96 : undefined}
      openRows={isWide}
      prominentTitle={isWide}
    />
  );
}
