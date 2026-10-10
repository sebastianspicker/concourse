/** Resolves an event route to a refreshable detail view while retaining list selection context. */
import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, Share, StyleSheet, Text, View } from "react-native";
import { useEvents } from "@/data/public/resources";
import { useLocale } from "@/localization/LocaleContext";
import { MetaRow } from "@/design-system/MetaRow";
import { ResourceDetailScreen } from "@/design-system/ResourceDetailScreen";
import { spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeProvider";
import { Button } from "@/design-system/Button";
import { useHydratedWindowWidth } from "@/design-system/useHydratedWindowWidth";
import { formatBoardDateTime, formatBoardTime, formatEventDate, formatLongDate } from "@/localization/dateFormat";
import { getInstitutionTimeZone } from "@/platform/env/institution";
import { selectedEventDetails, useSelectedDetail } from "@/data/public/selectedDetailRecords";
import { shareEventOnWeb } from "@/platform/sharing/webShare";
import { isStaticDemo } from "@/data/public/staticDemo";
import { STATIC_DEMO_EVENT_IDS } from "@/data/public/staticDemoData";

type ShareStatus = { message: string; kind: "success" | "error" };

type EventActionProps = {
  icon: "open-in-new" | "share";
  label: string;
  variant: "primary" | "secondary";
  block: boolean;
} & (
  | { role: "link"; href: string }
  | { role: "button"; onPress: () => void }
);

/** Renders an event action as either an outbound link or an in-app share button. */
function EventAction(props: EventActionProps): JSX.Element {
  const { icon, label, role, variant, block } = props;
  const testID = icon === "open-in-new" ? "event-source-action" : "event-share-action";
  if (role === "link") {
    return (
      <Link href={props.href} asChild>
        <Button testID={testID} accessibilityRole="link" variant={variant} icon={icon} trailingIcon label={label} block={block} />
      </Link>
    );
  }
  return <Button testID={testID} variant={variant} icon={icon} trailingIcon={icon === "open-in-new"} label={label} onPress={props.onPress} block={block} />;
}

/** Resolves a selected event into detail, source-link, and share actions. */
export default function EventDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useEvents();
  const collection = state.data?.events ?? null;
  const event = useSelectedDetail(selectedEventDetails, id, collection, state.source, state.data?._degraded === true);
  const { locale, t } = useLocale();
  const theme = useTheme();
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);
  const timeZone = getInstitutionTimeZone();
  const staticDemo = isStaticDemo();
  const isWide = useHydratedWindowWidth() >= 600;

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
      kicker={t("kickerEvent")}
      cardTitle={event?.title ?? String(id)}
      cardSubtitle={event ? formatBoardDateTime(event.date, locale, timeZone) : undefined}
      renderMeta={event ? () => (
        <>
          <MetaRow label={t("date")} value={formatLongDate(event.date, locale, timeZone)} data />
          <MetaRow label={t("starts")} value={formatBoardTime(event.date, locale, timeZone)} data />
          <MetaRow label={t("source")} value={event.sourceUrl} />
        </>
      ) : undefined}
      renderActions={event ? () => (
        <View style={styles.actionStack}>
          <View style={[styles.actions, !isWide && styles.actionsStacked]}>
            {staticDemo ? (
              <EventAction block={!isWide} variant="primary" icon="open-in-new" label={`${t("officialSource")} · ${t("simulated")}`} onPress={simulateOfficialSource} role="button" />
            ) : (
              <EventAction block={!isWide} variant="primary" icon="open-in-new" label={t("officialSource")} href={event.sourceUrl} role="link" />
            )}
            <EventAction block={!isWide} variant="secondary" icon="share" label={staticDemo ? `${t("share")} · ${t("simulated")}` : t("share")} onPress={() => void share()} role="button" />
          </View>
          {shareStatus ? <Text accessibilityLiveRegion={shareStatus.kind === "error" ? "assertive" : "polite"} style={[styles.shareStatus, { color: shareStatus.kind === "error" ? theme.colors.error : theme.colors.success }]}>{shareStatus.message}</Text> : null}
        </View>
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
  actionStack: { gap: spacing.md, flexGrow: 1, alignSelf: "stretch" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  actionsStacked: { flexDirection: "column", alignItems: "stretch" },
  shareStatus: { ...typography.captionStrong },
});
