import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { PublicEvent } from "@campus/shared";
import { DegradedBanner } from "@/components/DegradedBanner";
import { SearchBar } from "@/components/SearchBar";
import { useEvents } from "@/hooks/useEvents";
import { useLocale } from "@/i18n/LocaleContext";
import { EventListControls } from "@/screens/eventsListControls";
import {
  getEventAccessibilityLabel,
  getEventCard,
  getEventHref,
  getEventsEmptyHint,
  getEventsEmptyMessage,
  sortEventsByDate,
  type SortDirection,
} from "@/screens/eventsScreenHelpers";
import { ResourceList } from "@/ui/ResourceList";
import { Screen } from "@/ui/Screen";
import { StatusBanner } from "@/ui/StatusBanner";
import { spacing } from "@/ui/theme";

export default function EventsScreen(): JSX.Element {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const state = useEvents({ search: search || undefined });
  const events = sortEventsByDate(state.data?.events ?? [], sortDirection);
  const keyExtractor = useCallback((item: PublicEvent) => item.id, []);
  const href = useCallback((item: PublicEvent) => getEventHref(item), []);
  const renderCard = useCallback((item: PublicEvent) => getEventCard(item), []);
  const accessibilityLabel = useCallback((item: PublicEvent) => getEventAccessibilityLabel(item), []);

  const header = (
    <View style={styles.header}>
      <SearchBar value={search} onChangeText={setSearch} label={t("searchEvents")} placeholder={t("searchEvents")} testID="events-search" />
      <EventListControls loading={state.loading} resultCount={events.length} search={search} sortDirection={sortDirection} onToggleSort={() => setSortDirection((value) => value === "asc" ? "desc" : "asc")} />
      {state.source === "persisted-cache" ? <StatusBanner kind="cached" cacheAge={state.cacheAge} /> : null}
      <DegradedBanner visible={state.data?._degraded === true} />
    </View>
  );

  return (
    <Screen scroll={false} maxWidth={760} testID="events-screen">
      <ResourceList
        testID="events-list"
        header={header}
        items={events}
        loading={state.loading}
        error={state.error}
        refreshing={state.refreshing}
        onRefresh={() => void state.refresh()}
        emptyMessage={search ? getEventsEmptyMessage(search) : t("noEvents")}
        emptyHint={getEventsEmptyHint(search)}
        keyExtractor={keyExtractor}
        href={href}
        renderCard={renderCard}
        accessibilityLabel={accessibilityLabel}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { gap: spacing.md, paddingBottom: spacing.md } });
