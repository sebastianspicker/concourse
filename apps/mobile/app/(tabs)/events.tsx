import React, { useCallback, useState } from "react";
import { DegradedBanner } from "@/components/DegradedBanner";
import { useEvents } from "@/hooks/useEvents";
import { SearchBar } from "@/components/SearchBar";
import { EventListControls } from "@/screens/eventsListControls";
import {
  getEventAccessibilityLabel,
  getEventCard,
  getEventHref,
  getEventsEmptyHint,
  getEventsEmptyMessage,
  sortEventsByDate
} from "@/screens/eventsScreenHelpers";
import type { SortDirection } from "@/screens/eventsScreenHelpers";
import { ResourceListSection } from "@/ui/ResourceListSection";
import { Screen } from "@/ui/Screen";
import type { PublicEvent } from "@campus/shared";

export default function EventsScreen(): JSX.Element {
  const [search, setSearch] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { data, error, loading, refreshing, refresh } = useEvents({ search: search || undefined });
  const sortedEvents = sortEventsByDate(data?.events ?? [], sortDirection);

  const toggleSort = useCallback(() => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const keyExtractor = useCallback((e: PublicEvent) => e.id, []);
  const href = useCallback((e: PublicEvent) => getEventHref(e), []);
  const renderCard = useCallback((e: PublicEvent) => getEventCard(e), []);
  const accessibilityLabel = useCallback((e: PublicEvent) => getEventAccessibilityLabel(e), []);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search events..." />
      <EventListControls
        loading={loading}
        resultCount={sortedEvents.length}
        search={search}
        sortDirection={sortDirection}
        onToggleSort={toggleSort}
      />
      <DegradedBanner visible={data?._degraded === true} />
      <ResourceListSection
        title="Events"
        loading={loading}
        error={error}
        items={sortedEvents}
        emptyMessage={getEventsEmptyMessage(search)}
        emptyHint={getEventsEmptyHint(search)}
        emptyIcon={"📅"}
        keyExtractor={keyExtractor}
        href={href}
        renderCard={renderCard}
        accessibilityLabel={accessibilityLabel}
        onRetry={refresh}
      />
    </Screen>
  );
}
