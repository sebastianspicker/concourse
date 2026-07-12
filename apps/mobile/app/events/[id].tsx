import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback } from "react";
import { Linking, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { PublicEventSchema, type PublicEvent } from "@campus/shared";
import { useEvents } from "@/hooks/useEvents";
import { useLocale } from "@/i18n/LocaleContext";
import { MetaRow } from "@/ui/MetaRow";
import { ResourceDetailScreen } from "@/ui/ResourceDetailScreen";
import { spacing, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import { formatEventDate } from "@/utils/dateFormat";
import { parseRouteItem } from "@/utils/routeItem";

export default function EventDetailScreen(): JSX.Element {
  const { id, item } = useLocalSearchParams<{ id: string; item?: string }>();
  const routedEvent = parseRouteItem<PublicEvent>(item, PublicEventSchema);
  const state = useEvents();
  const event = state.data?.events.find((entry) => entry.id === id) ?? (routedEvent?.id === id ? routedEvent : null);
  const theme = useTheme();
  const { t } = useLocale();

  const share = useCallback(async () => {
    if (!event) return;
    await Share.share({ message: `${event.title} - ${formatEventDate(event.date)}`, url: event.sourceUrl });
  }, [event]);

  return (
    <ResourceDetailScreen
      title={t("events")}
      loading={event ? false : state.loading}
      error={state.error}
      item={event}
      notFoundMessage={t("errorNotFound")}
      cardTitle={event?.title ?? String(id)}
      cardSubtitle={event ? formatEventDate(event.date) : undefined}
      renderMeta={event ? () => (
        <>
          <MetaRow label={t("date")} value={formatEventDate(event.date)} />
          <MetaRow label={t("source")} value={event.sourceUrl} />
          <View style={styles.actions}>
            <Action icon="open-in-new" label={t("officialSource")} onPress={() => void Linking.openURL(event.sourceUrl)} role="link" />
            <Action icon="share" label={t("share")} onPress={() => void share()} role="button" />
          </View>
        </>
      ) : undefined}
      refreshing={state.refreshing}
      onRefresh={state.refresh}
    />
  );

  function Action({ icon, label, onPress, role }: { icon: "open-in-new" | "share"; label: string; onPress: () => void; role: "link" | "button" }): JSX.Element {
    return (
      <Pressable accessibilityRole={role} accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.action, { borderColor: theme.colors.controlBorder }, pressed && styles.pressed]}>
        <MaterialIcons name={icon} size={20} color={theme.colors.accent} />
        <Text style={[styles.actionText, { color: theme.colors.accent }]}>{label}</Text>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingVertical: spacing.md },
  action: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, borderWidth: 1, borderRadius: 8 },
  actionText: { ...typography.caption, fontWeight: "600" },
  pressed: { opacity: 0.7 },
});
