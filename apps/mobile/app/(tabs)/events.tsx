import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DegradedBanner } from "@/components/DegradedBanner";
import { useEvents } from "@/hooks/useEvents";
import { SearchBar } from "@/components/SearchBar";
import { ResourceListSection } from "@/ui/ResourceListSection";
import { Screen } from "@/ui/Screen";
import { scaledRadius, spacing, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import { formatEventDate } from "@/utils/dateFormat";
import type { PublicEvent } from "@campus/shared";

type SortDirection = "asc" | "desc";

export default function EventsScreen(): JSX.Element {
  const [search, setSearch] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { data, error, loading, refreshing, refresh } = useEvents({ search: search || undefined });
  const theme = useTheme();
  const ui = theme.ui;

  const sortedEvents = useMemo(() => {
    const events = data?.events ?? [];
    return [...events].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [data?.events, sortDirection]);

  const toggleSort = useCallback(() => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const keyExtractor = useCallback((e: PublicEvent) => e.id, []);
  const href = useCallback(
    (e: PublicEvent) => ({ pathname: "/events/[id]" as const, params: { id: e.id } }),
    []
  );
  const renderCard = useCallback(
    (e: PublicEvent) => ({
      title: e.title,
      subtitle: formatEventDate(e.date)
    }),
    []
  );
  const accessibilityLabel = useCallback(
    (e: PublicEvent) => `${e.title}. ${formatEventDate(e.date)}.`,
    []
  );

  const resultCount = sortedEvents.length;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search events..."
      />
      <View style={styles.controls}>
        {!loading ? (
          <Text style={[styles.resultCount, { color: theme.colors.muted }]}>
            {resultCount} {resultCount === 1 ? "event" : "events"}
            {search ? ` for "${search}"` : ""}
          </Text>
        ) : null}
        <Pressable
          onPress={toggleSort}
          style={({ pressed }) => [
            styles.sortButton,
            {
              borderColor: theme.colors.border,
              borderWidth: ui.borderWidth,
              borderRadius: scaledRadius(8, ui),
            },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Sort by date ${sortDirection === "asc" ? "descending" : "ascending"}`}
        >
          <Text style={[styles.sortText, { color: theme.colors.text }]}>
            {sortDirection === "asc" ? "↑ Oldest" : "↓ Newest"}
          </Text>
        </Pressable>
      </View>
      <DegradedBanner visible={data?._degraded === true} />
      <ResourceListSection
        title="Events"
        loading={loading}
        error={error}
        items={sortedEvents}
        emptyMessage={search ? `No events matching "${search}"` : "No public events yet."}
        emptyHint={search ? "Try a different search term or clear your search." : "Pull down to refresh -- new events appear as they are published."}
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

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultCount: {
    ...typography.caption,
    flex: 1,
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
