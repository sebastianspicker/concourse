import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DegradedBanner } from "@/components/DegradedBanner";
import { useToday } from "@/hooks/useToday";
import { useSchedule } from "@/hooks/useSchedule";
import { ResourceListSection } from "@/ui/ResourceListSection";
import { Screen } from "@/ui/Screen";
import { scaledFont, scaledRadius, spacing, typography, withOpacity } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import { formatEventDate, formatRelativeTime, formatScheduleTime, formatTimeRange } from "@/utils/dateFormat";
import type { PublicEvent } from "@campus/shared";
import type { ScheduleItem } from "@campus/shared";

type SortDirection = "asc" | "desc";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function TodayScreen(): JSX.Element {
  const { data, error, loading, refreshing, refresh } = useToday();
  const scheduleState = useSchedule();
  const [scheduleSortDirection, setScheduleSortDirection] = useState<SortDirection>("asc");
  const theme = useTheme();
  const ui = theme.ui;

  const refreshingAll = refreshing || scheduleState.refreshing;
  const scheduleRefresh = scheduleState.refresh;
  const refreshAll = useCallback(async () => {
    await Promise.all([refresh(), scheduleRefresh()]);
  }, [refresh, scheduleRefresh]);

  const rawEvents = data?.events;
  const events = useMemo(() => rawEvents ?? [], [rawEvents]);

  const sortedSchedule = useMemo(() => {
    const items = scheduleState.data?.schedule ?? [];
    return [...items].sort((a, b) => {
      const dateA = new Date(a.startsAt).getTime();
      const dateB = new Date(b.startsAt).getTime();
      return scheduleSortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [scheduleState.data?.schedule, scheduleSortDirection]);

  const toggleScheduleSort = useCallback(() => {
    setScheduleSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const eventsKeyExtractor = useCallback((e: PublicEvent) => e.id, []);
  const eventsHref = useCallback(
    (e: PublicEvent) => ({ pathname: "/events/[id]" as const, params: { id: e.id } }),
    []
  );
  const eventsRenderCard = useCallback(
    (e: PublicEvent) => ({
      title: e.title,
      subtitle: `${formatEventDate(e.date)} · ${formatRelativeTime(e.date)}`
    }),
    []
  );
  const eventsAccessibilityLabel = useCallback(
    (e: PublicEvent) => `${e.title}. ${formatEventDate(e.date)}. ${formatRelativeTime(e.date)}.`,
    []
  );

  const scheduleKeyExtractor = useCallback((s: ScheduleItem) => s.id, []);
  const scheduleHref = useCallback(
    (s: ScheduleItem) => ({ pathname: "/schedule/[id]" as const, params: { id: s.id } }),
    []
  );
  const scheduleRenderCard = useCallback(
    (s: ScheduleItem) => ({
      title: s.title,
      subtitle: `${formatTimeRange(s.startsAt, s.endsAt)} · ${s.location ?? "TBA"}`
    }),
    []
  );
  const scheduleAccessibilityLabel = useCallback(
    (s: ScheduleItem) =>
      `${s.title}. ${formatScheduleTime(s.startsAt)}. Location: ${s.location ?? "TBA"}.`,
    []
  );

  const eventCount = events.length;
  const scheduleCount = sortedSchedule.length;

  return (
    <Screen refreshing={refreshingAll} onRefresh={refreshAll}>
      {/* Hero greeting area */}
      <View style={styles.heroContainer}>
        <Text
          style={[
            styles.greeting,
            {
              color: theme.colors.text,
              fontSize: scaledFont(typography.heading.fontSize, ui),
              lineHeight: scaledFont(typography.heading.lineHeight, ui),
            },
          ]}
        >
          {getGreeting()} 👋
        </Text>
        <Text
          style={[
            styles.dateText,
            {
              color: theme.colors.muted,
              fontSize: scaledFont(typography.body.fontSize, ui),
              lineHeight: scaledFont(typography.body.lineHeight, ui),
            },
          ]}
        >
          {getFormattedDate()}
        </Text>

        {/* Quick stats pills */}
        {!loading && !scheduleState.loading ? (
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statPill,
                {
                  backgroundColor: withOpacity(theme.colors.accent, theme.isDark ? 0.15 : 0.08),
                  borderRadius: scaledRadius(12, ui),
                },
              ]}
            >
              <Text style={[styles.statNumber, { color: theme.colors.accent }]}>
                {eventCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.muted }]}>
                {eventCount === 1 ? "event" : "events"}
              </Text>
            </View>
            <View
              style={[
                styles.statPill,
                {
                  backgroundColor: withOpacity(theme.colors.info, theme.isDark ? 0.15 : 0.08),
                  borderRadius: scaledRadius(12, ui),
                },
              ]}
            >
              <Text style={[styles.statNumber, { color: theme.colors.info }]}>
                {scheduleCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.muted }]}>
                {scheduleCount === 1 ? "class" : "classes"}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <DegradedBanner visible={data?._degraded === true} />

      <ResourceListSection
        title="Events"
        loading={loading}
        error={error}
        items={events}
        emptyMessage="No public events today."
        emptyHint="Pull down to refresh, or check the Events tab for upcoming events."
        emptyIcon={"📅"}
        keyExtractor={eventsKeyExtractor}
        href={eventsHref}
        renderCard={eventsRenderCard}
        accessibilityLabel={eventsAccessibilityLabel}
        onRetry={refreshAll}
      />
      <View style={styles.scheduleHeader}>
        <Pressable
          onPress={toggleScheduleSort}
          style={({ pressed }) => [
            styles.sortButton,
            {
              borderColor: theme.colors.border,
              borderWidth: theme.ui.borderWidth,
              borderRadius: scaledRadius(8, ui),
            },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Sort schedule ${scheduleSortDirection === "asc" ? "latest first" : "earliest first"}`}
        >
          <Text style={[styles.sortText, { color: theme.colors.text }]}>
            {scheduleSortDirection === "asc" ? "↑ Earliest first" : "↓ Latest first"}
          </Text>
        </Pressable>
      </View>
      <ResourceListSection
        title="Schedule"
        loading={scheduleState.loading}
        error={scheduleState.error}
        items={sortedSchedule}
        emptyMessage="No classes scheduled today."
        emptyHint="Your schedule will appear here once a public calendar feed is configured."
        emptyIcon={"📋"}
        keyExtractor={scheduleKeyExtractor}
        href={scheduleHref}
        renderCard={scheduleRenderCard}
        accessibilityLabel={scheduleAccessibilityLabel}
        onRetry={refreshAll}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    marginBottom: spacing.sm,
  },
  greeting: {
    ...typography.heading,
  },
  dateText: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statNumber: {
    ...typography.subheading,
    fontWeight: "700",
  },
  statLabel: {
    ...typography.caption,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  sortButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sortText: {
    ...typography.caption,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});
