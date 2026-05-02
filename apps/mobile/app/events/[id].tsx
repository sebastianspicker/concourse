import { useLocalSearchParams } from "expo-router";
import React, { useCallback } from "react";
import { Pressable, Share, StyleSheet, Text } from "react-native";
import { useEvents } from "@/hooks/useEvents";
import { MetaRow } from "@/ui/MetaRow";
import { ResourceDetailScreen } from "@/ui/ResourceDetailScreen";
import { spacing, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import { formatEventDate } from "@/utils/dateFormat";
import { parseRouteItem } from "@/utils/routeItem";
import { PublicEventSchema, type PublicEvent } from "@campus/shared";

export default function EventDetailScreen(): JSX.Element {
  const { id, item } = useLocalSearchParams<{ id: string; item?: string }>();
  const routedEvent = parseRouteItem<PublicEvent>(item, PublicEventSchema);
  const { data, loading, error, refreshing, refresh } = useEvents();
  const fetchedEvent = data?.events.find((entry) => entry.id === id) ?? null;
  const event = fetchedEvent ?? (routedEvent?.id === id ? routedEvent : null);
  const effectiveLoading = event ? false : loading;
  const theme = useTheme();

  const handleShare = useCallback(async () => {
    if (!event) return;
    await Share.share({
      message: `${event.title} - ${formatEventDate(event.date)}`,
      url: event.sourceUrl,
    });
  }, [event]);

  return (
    <ResourceDetailScreen
      title="Event Details"
      loading={effectiveLoading}
      error={error}
      item={event ?? null}
      notFoundMessage="Event not found."
      cardTitle={event ? event.title : `Event ID: ${id}`}
      cardSubtitle={event ? formatEventDate(event.date) : undefined}
      renderMeta={
        event
          ? () => (
              <>
                <MetaRow
                  label="Date"
                  value={formatEventDate(event.date)}
                />
                <MetaRow label="Source" value={event.sourceUrl} />
                <Pressable
                  onPress={handleShare}
                  style={({ pressed }) => [
                    styles.shareButton,
                    {
                      backgroundColor: theme.colors.accent,
                      borderRadius: 12,
                    },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Share this event"
                >
                  <Text style={styles.shareIcon}>📤</Text>
                  <Text style={[styles.shareText, { color: theme.colors.accentText }]}>
                    Share Event
                  </Text>
                </Pressable>
              </>
            )
          : undefined
      }
      footnote="This detail view uses public data only."
      refreshing={refreshing}
      onRefresh={refresh}
    />
  );
}

const styles = StyleSheet.create({
  shareButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  shareIcon: {
    fontSize: 16,
  },
  shareText: {
    ...typography.body,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});
