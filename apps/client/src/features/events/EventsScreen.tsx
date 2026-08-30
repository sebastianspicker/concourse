/** Renders searchable, sortable event discovery with degraded-data disclosure. */
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { PublicEvent } from "@concourse/contracts";
import { DegradedBanner } from "@/design-system/DegradedBanner";
import { SearchBar } from "@/design-system/SearchBar";
import { SignalPageHeader } from "@/shell/SignalPageHeader";
import { useEvents } from "@/data/public/useEvents";
import { useLocale } from "@/localization/LocaleContext";
import { EventListControls } from "@/features/events/eventsListControls";
import {
  getEventAccessibilityLabel,
  getEventCard,
  getEventHref,
  getEventsEmptyHint,
  getEventsEmptyMessage,
  sortEventsByDate,
  type SortDirection,
} from "@/features/events/eventsScreenHelpers";
import { ResourceList } from "@/design-system/ResourceList";
import { Screen } from "@/design-system/Screen";
import { StatusBanner } from "@/design-system/StatusBanner";
import { spacing } from "@/design-system/theme";
import { getInstitutionTimeZone } from "@/platform/env/institution";
import { selectedEventDetails } from "@/data/public/selectedDetailRecords";

/** Presents searchable, sortable events and their request-state feedback. */
export default function EventsScreen(): JSX.Element {
  const { locale, t } = useLocale();
  const timeZone = getInstitutionTimeZone();
  const [search, setSearch] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const state = useEvents({ search: search || undefined });
  const events = sortEventsByDate(state.data?.events ?? [], sortDirection);
  const keyExtractor = useCallback((item: PublicEvent) => item.id, []);
  const href = useCallback((item: PublicEvent) => getEventHref(item), []);
  const renderCard = useCallback((item: PublicEvent) => getEventCard(item, locale, timeZone), [locale, timeZone]);
  const accessibilityLabel = useCallback((item: PublicEvent) => getEventAccessibilityLabel(item, locale, timeZone), [locale, timeZone]);
  const onNavigate = useCallback((item: PublicEvent) => {
    selectedEventDetails.remember(item, { authoritative: state.source === "network" });
  }, [state.source]);

  const header = (
    <View style={styles.header}>
      <SignalPageHeader title={t("events")} />
      <SearchBar value={search} onChangeText={setSearch} label={t("searchEvents")} placeholder={t("searchEvents")} testID="events-search" />
      <EventListControls loading={state.loading} resultCount={events.length} search={search} sortDirection={sortDirection} onToggleSort={() => setSortDirection((value) => value === "asc" ? "desc" : "asc")} />
      {state.source === "persisted-cache" ? <StatusBanner kind="cached" cacheAge={state.cacheAge} /> : null}
      <DegradedBanner visible={state.data?._degraded === true} />
    </View>
  );

  return (
    <Screen scroll={false} maxWidth={1400} testID="events-screen">
      <ResourceList
        testID="events-list"
        header={header}
        items={events}
        loading={state.loading}
        error={state.error}
        refreshing={state.refreshing}
        onRefresh={() => void state.refresh()}
        emptyMessage={search ? getEventsEmptyMessage(search, t) : t("noEvents")}
        emptyHint={getEventsEmptyHint(search, t)}
        keyExtractor={keyExtractor}
        href={href}
        renderCard={renderCard}
        accessibilityLabel={accessibilityLabel}
        onNavigate={onNavigate}
        variant="route"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { gap: spacing.xl, paddingBottom: spacing.xl } });
