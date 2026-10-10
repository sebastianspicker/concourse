/** Renders searchable, sortable event discovery with degraded-data disclosure. */
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { PublicEvent } from "@concourse/contracts";
import { DegradedBanner } from "@/design-system/DegradedBanner";
import { SearchBar } from "@/design-system/SearchBar";
import { PageHeader } from "@/design-system/PageHeader";
import { useEvents } from "@/data/public/resources";
import { useLocale } from "@/localization/LocaleContext";
import { getFirstOfDayIds } from "@/localization/dateFormat";
import { useMinuteTick } from "@/localization/useMinuteTick";
import { EventListControls } from "@/features/events/EventsControls";
import {
  getEventAccessibilityLabel,
  getEventCard,
  getEventHref,
  getEventsEmptyHint,
  getEventsEmptyMessage,
  sortEventsByDate,
} from "@/features/events/eventsScreenHelpers";
import { ResourceList } from "@/design-system/ResourceList";
import { Screen } from "@/design-system/Screen";
import type { SortDirection } from "@/design-system/SortButton";
import { StatusBanner } from "@/design-system/StatusBanner";
import { CONTENT_MAX_WIDTH, spacing } from "@/design-system/theme";
import { getInstitutionTimeZone } from "@/platform/env/institution";
import { selectedEventDetails } from "@/data/public/selectedDetailRecords";

/** Presents searchable, sortable events and their request-state feedback. */
export default function EventsScreen(): JSX.Element {
  const { locale, t } = useLocale();
  const timeZone = getInstitutionTimeZone();
  const [search, setSearch] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const state = useEvents({ search: search || undefined });
  const events = useMemo(() => sortEventsByDate(state.data?.events ?? [], sortDirection), [sortDirection, state.data]);
  const dayStarts = useMemo(() => getFirstOfDayIds(events, (event) => event.id, (event) => event.date, timeZone), [events, timeZone]);
  const keyExtractor = useCallback((item: PublicEvent) => item.id, []);
  const href = useCallback((item: PublicEvent) => getEventHref(item), []);
  const now = useMinuteTick();
  // `now` is a dependency so relative times ("in 7 hours") refresh every minute.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderCard = useCallback((item: PublicEvent) => getEventCard(item, locale, timeZone, dayStarts.has(item.id)), [dayStarts, locale, timeZone, now]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const accessibilityLabel = useCallback((item: PublicEvent) => getEventAccessibilityLabel(item, locale, timeZone), [locale, timeZone, now]);
  const onNavigate = useCallback((item: PublicEvent) => {
    selectedEventDetails.remember(item, { authoritative: state.source === "network" });
  }, [state.source]);

  const header = (
    <View style={styles.header}>
      <PageHeader title={t("events")} intro={t("eventsIntro")} />
      <SearchBar value={search} onChangeText={setSearch} label={t("searchEvents")} placeholder={t("eventTitlePlaceholder")} testID="events-search" />
      {state.source === "persisted-cache" ? <StatusBanner kind="cached" cacheAge={state.cacheAge} /> : null}
      <DegradedBanner visible={state.data?._degraded === true} />
      <EventListControls loading={state.loading} resultCount={events.length} search={search} sortDirection={sortDirection} onToggleSort={() => setSortDirection((value) => value === "asc" ? "desc" : "asc")} />
    </View>
  );

  return (
    <Screen scroll={false} maxWidth={CONTENT_MAX_WIDTH} testID="events-screen">
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
        variant="card"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { gap: spacing.xl } });
