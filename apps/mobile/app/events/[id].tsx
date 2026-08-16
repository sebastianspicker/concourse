/** Resolves an event route to a refreshable detail view while retaining list selection context. */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useEvents } from "@/hooks/useEvents";
import { useLocale } from "@/i18n/LocaleContext";
import { MetaRow } from "@/ui/MetaRow";
import { ResourceDetailScreen } from "@/ui/ResourceDetailScreen";
import { spacing, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import { formatEventDate } from "@/utils/dateFormat";
import { getInstitutionTimeZone } from "@/config/institution";
import { reconcileSelectedDetailRecord, selectDetailRecord, selectedEventDetails } from "@/data/selectedDetailRecords";
import { shareEventOnWeb } from "@/utils/webShare";
import { isStaticDemo } from "@/config/staticDemo";
import { STATIC_DEMO_EVENT_IDS } from "@/data/staticDemoData";

type ShareStatus = { message: string; kind: "success" | "error" };

type EventActionBaseProps = {
  icon: "open-in-new" | "share";
  label: string;
};

type EventActionProps = EventActionBaseProps & (
  | { role: "link"; href: string }
  | { role: "button"; onPress: () => void }
);

/** Renders an accessible event action as either an external link or an in-app share button. */
function EventAction(props: EventActionProps): JSX.Element {
  const { icon, label, role } = props;
  const theme = useTheme();

  const action = (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      onPress={role === "button" ? props.onPress : undefined}
      style={styles.actionPressTarget}
    >
      {({ pressed }) => (
        <View
          testID={role === "link" ? "event-source-action" : "event-share-action"}
          style={[
            styles.action,
            {
              borderColor: theme.colors.controlBorder,
              borderWidth: theme.ui.borderWidth,
              borderRadius: 0,
              backgroundColor: theme.colors.surface,
            },
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name={icon} size={20} color={theme.colors.accent} />
          <Text style={[styles.actionText, { color: theme.colors.accent }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );

  return role === "link" ? <Link href={props.href} asChild>{action}</Link> : action;
}

/** Resolves a selected event into detail, source-link, and share actions. */
export default function EventDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useEvents();
  const collection = state.data?.events ?? null;
  const event = selectDetailRecord(
    id,
    collection,
    state.source,
    selectedEventDetails.get(id),
    state.data?._degraded === true
  );
  const { locale, t } = useLocale();
  const theme = useTheme();
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);
  const timeZone = getInstitutionTimeZone();
  const staticDemo = isStaticDemo();

  useEffect(() => {
    reconcileSelectedDetailRecord(selectedEventDetails, id, collection, state.source, state.data?._degraded === true);
  }, [collection, id, state.data?._degraded, state.source]);

  const share = useCallback(async () => {
    if (!event) return;
    setShareStatus(null);
    if (staticDemo) {
      setShareStatus({ message: t("simulatedShare"), kind: "success" });
      return;
    }
    if (Platform.OS === "web") {
      const result = await shareEventOnWeb(event.title, event.sourceUrl);
      if (result === "shared") setShareStatus({ message: t("shareComplete"), kind: "success" });
      if (result === "copied") setShareStatus({ message: t("shareCopied"), kind: "success" });
      if (result === "failed") setShareStatus({ message: t("shareFailed"), kind: "error" });
      return;
    }
    try {
      await Share.share({ message: `${event.title} - ${formatEventDate(event.date, locale, timeZone)}`, url: event.sourceUrl });
    } catch {
      setShareStatus({ message: t("shareFailed"), kind: "error" });
    }
  }, [event, locale, staticDemo, t, timeZone]);

  const simulateOfficialSource = useCallback(() => {
    setShareStatus({ message: t("simulatedOpenSource"), kind: "success" });
  }, [t]);

  return (
    <ResourceDetailScreen
      loading={state.loading}
      error={state.error}
      item={event}
      notFoundMessage={t("errorNotFound")}
      cardTitle={event?.title ?? String(id)}
      cardSubtitle={event ? formatEventDate(event.date, locale, timeZone) : undefined}
      renderMeta={event ? () => (
        <>
          <MetaRow label={t("date")} value={formatEventDate(event.date, locale, timeZone)} />
          <MetaRow label={t("source")} value={event.sourceUrl} />
          <View style={styles.actions}>
            {staticDemo ? (
              <EventAction icon="open-in-new" label={`${t("officialSource")} · ${t("simulated")}`} onPress={simulateOfficialSource} role="button" />
            ) : (
              <EventAction icon="open-in-new" label={t("officialSource")} href={event.sourceUrl} role="link" />
            )}
            <EventAction icon="share" label={staticDemo ? `${t("share")} · ${t("simulated")}` : t("share")} onPress={() => void share()} role="button" />
          </View>
          {shareStatus ? <Text accessibilityLiveRegion={shareStatus.kind === "error" ? "assertive" : "polite"} style={[styles.shareStatus, { color: shareStatus.kind === "error" ? theme.colors.error : theme.colors.success }]}>{shareStatus.message}</Text> : null}
        </>
      ) : undefined}
      cached={state.source === "persisted-cache"}
      cacheAge={state.cacheAge}
      degraded={state.data?._degraded === true}
      refreshing={state.refreshing}
      onRefresh={state.refresh}
    />
  );
}

/** Pre-renders the sanitized fixture detail routes for static hosting. */
export function generateStaticParams(): Array<{ id: string }> {
  return STATIC_DEMO_EVENT_IDS.map((id) => ({ id }));
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingVertical: spacing.md },
  actionPressTarget: { alignSelf: "flex-start" },
  action: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg },
  actionText: { ...typography.caption, fontWeight: "600" },
  pressed: { opacity: 0.7 },
  shareStatus: { ...typography.caption, fontWeight: "600" },
});
