/** Composes the Today agenda: state notices, the day's running order, and upcoming events. */
import { useCallback, useMemo } from "react";
import { Text, View } from "react-native";
import type { PublicEvent, ScheduleItem } from "@concourse/contracts";
import { DegradedBanner } from "@/design-system/DegradedBanner";
import { ResourceListSection } from "@/design-system/ResourceList";
import { SortButton, type SortDirection } from "@/design-system/SortButton";
import { StatusBanner } from "@/design-system/StatusBanner";
import { useTheme } from "@/design-system/ThemeProvider";
import type { useSchedule, useToday } from "@/data/public/resources";
import {
  selectedEventDetails,
  selectedScheduleDetails,
  type DetailSource,
} from "@/data/public/selectedDetailRecords";
import { getFirstOfDayIds } from "@/localization/dateFormat";
import { useLocale } from "@/localization/LocaleContext";
import { getInstitutionTimeZone } from "@/platform/env/institution";
import type { UiError } from "@/platform/http/uiError";
import { styles } from "./TodayAgenda.styles";
import {
  getEventAccessibilityLabel,
  getEventCard,
  getEventHref,
  getScheduleAccessibilityLabel,
  getScheduleCard,
  getScheduleEntryState,
  getScheduleHref,
  type TodayScheduleSlice,
} from "./todayScreenHelpers";

const SCHEDULE_SORT_LABEL_KEYS = { asc: "sortScheduleAscending", desc: "sortScheduleDescending" } as const;

type BoardSelection = { current?: ScheduleItem; next?: ScheduleItem };

function useCountLabel(count: number, loading: boolean): string | undefined {
  const { t } = useLocale();
  if (loading || count === 0) return undefined;
  return t(count === 1 ? "entryCountOne" : "entryCountOther", { count });
}

function ScheduleSection({
  sortDirection,
  onToggleSort,
  loading,
  error,
  items,
  selection,
  now,
  source,
  onRetry,
}: {
  sortDirection: SortDirection;
  onToggleSort: () => void;
  loading: boolean;
  error: UiError | null;
  items: ScheduleItem[];
  selection: BoardSelection;
  now: Date;
  source: DetailSource;
  onRetry: () => void;
}): JSX.Element {
  const { locale, t } = useLocale();
  const timeZone = getInstitutionTimeZone();
  const labels = useMemo(() => ({ now: t("now"), next: t("tagNext"), ended: t("tagEnded") }), [t]);
  const stateOf = useCallback((item: ScheduleItem) => getScheduleEntryState(item, selection, now), [now, selection]);
  const keyExtractor = useCallback((item: ScheduleItem) => item.id, []);
  const href = useCallback((item: ScheduleItem) => getScheduleHref(item), []);
  const renderCard = useCallback(
    (item: ScheduleItem) => getScheduleCard(item, locale, timeZone, t("toBeAnnounced"), stateOf(item), labels),
    [labels, locale, stateOf, t, timeZone],
  );
  const accessibilityLabel = useCallback((item: ScheduleItem) => {
    const state = stateOf(item);
    return getScheduleAccessibilityLabel(item, locale, timeZone, t("location"), t("toBeAnnounced"), state === "later" ? undefined : labels[state]);
  }, [labels, locale, stateOf, t, timeZone]);
  const onNavigate = useCallback((item: ScheduleItem) => {
    selectedScheduleDetails.remember(item, { authoritative: source === "network" });
  }, [source]);
  const countLabel = useCountLabel(items.length, loading);

  return (
    <ResourceListSection
      title={t("todaySchedule")}
      meta={countLabel}
      action={items.length > 1 ? (
        <SortButton
          sortDirection={sortDirection}
          onToggleSort={onToggleSort}
          labelKeys={SCHEDULE_SORT_LABEL_KEYS}
          accessibilityKey="sortScheduleAccessibility"
          variant="inline"
        />
      ) : undefined}
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
    />
  );
}

function TodayEventsSection({
  loading,
  error,
  events,
  now,
  source,
  onRetry,
}: {
  now: Date;
  loading: boolean;
  error: UiError | null;
  events: PublicEvent[];
  source: DetailSource;
  onRetry: () => void;
}): JSX.Element {
  const { locale, t } = useLocale();
  const timeZone = getInstitutionTimeZone();
  const dayStarts = useMemo(
    () => getFirstOfDayIds(events, (event) => event.id, (event) => event.date, timeZone),
    [events, timeZone],
  );
  const keyExtractor = useCallback((event: PublicEvent) => event.id, []);
  const href = useCallback((event: PublicEvent) => getEventHref(event), []);
  const renderCard = useCallback(
    // `now` is a dependency so relative times ("in 7 hours") refresh with the minute tick.
    (event: PublicEvent) => getEventCard(event, locale, timeZone, dayStarts.has(event.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayStarts, locale, timeZone, now],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const accessibilityLabel = useCallback((event: PublicEvent) => getEventAccessibilityLabel(event, locale, timeZone), [locale, timeZone, now]);
  const onNavigate = useCallback((event: PublicEvent) => {
    selectedEventDetails.remember(event, { authoritative: source === "network" });
  }, [source]);
  const countLabel = useCountLabel(events.length, loading);

  return (
    <ResourceListSection
      title={t("comingUp")}
      meta={countLabel}
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
      variant="card"
    />
  );
}

/** Cached and degraded banners for today’s public resources. */
export function TodayStateNotices({
  todayState,
  scheduleState,
}: {
  todayState: ReturnType<typeof useToday>;
  scheduleState: ReturnType<typeof useSchedule>;
}): JSX.Element | null {
  const cachedAges = [todayState, scheduleState]
    .filter((state) => state.source === "persisted-cache")
    .map((state) => state.cacheAge ?? 0);
  const degraded = todayState.data?._degraded === true || scheduleState.data?._degraded === true;
  if (cachedAges.length === 0 && !degraded) return null;
  return (
    <View style={styles.notices}>
      {cachedAges.length > 0 ? <StatusBanner kind="cached" cacheAge={Math.max(...cachedAges)} /> : null}
      <DegradedBanner visible={degraded} />
    </View>
  );
}

/** Notes when the schedule list is capped below the full public total. */
export function ScheduleLimitNotice({
  count,
  total,
}: {
  count: number;
  total: number;
}): JSX.Element | null {
  const theme = useTheme();
  const { t } = useLocale();
  if (total <= count) return null;
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[styles.limitNotice, { color: theme.colors.muted }]}
    >
      {t("scheduleLimitNotice", { count, total })}
    </Text>
  );
}

export function TodayAgenda({
  isWide,
  scheduleUnavailable,
  schedule,
  selection,
  now,
  scheduleState,
  todayState,
  sortDirection,
  onToggleSort,
}: {
  isWide: boolean;
  scheduleUnavailable: boolean;
  schedule: TodayScheduleSlice;
  selection: BoardSelection;
  now: Date;
  scheduleState: ReturnType<typeof useSchedule>;
  todayState: ReturnType<typeof useToday>;
  sortDirection: SortDirection;
  onToggleSort: () => void;
}): JSX.Element {
  return (
    <View style={[styles.agenda, isWide && styles.agendaWide]}>
      {!scheduleUnavailable ? (
        <View style={[styles.scheduleColumn, isWide && styles.scheduleColumnWide]}>
          <ScheduleSection
            sortDirection={sortDirection}
            onToggleSort={onToggleSort}
            loading={scheduleState.loading}
            error={scheduleState.error}
            items={schedule.items}
            selection={selection}
            now={now}
            source={scheduleState.source}
            onRetry={() => void scheduleState.refresh()}
          />
          <ScheduleLimitNotice count={schedule.items.length} total={schedule.total} />
        </View>
      ) : null}
      <View style={[styles.eventsColumn, isWide && (scheduleUnavailable ? styles.scheduleColumnWide : styles.eventsColumnWide)]}>
        <TodayEventsSection
          loading={todayState.loading}
          error={todayState.error}
          events={todayState.data?.events ?? []}
          now={now}
          source={todayState.source}
          onRetry={() => void todayState.refresh()}
        />
      </View>
    </View>
  );
}
