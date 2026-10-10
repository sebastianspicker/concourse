/** List rows (time or date column, entry, aside, state) and event cards (date, title, round arrow). */
import { Link } from "expo-router";
import React, { type ComponentProps, useCallback, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { ArrowCircle } from "./ArrowCircle";
import { styles } from "./ResourceListItem.styles";
import { getResourceRowBackground } from "./resourceRowBackground";
import { useTheme, useDesignMetrics } from "./ThemeProvider";
import { useHydratedWindowWidth } from "./useHydratedWindowWidth";

/** Board status of a row relative to the current campus minute. */
export type RowStatus = { label: string; kind: "now" | "next" | "ended" };

export type ResourceListContent = {
  title: string;
  subtitle?: string;
  /** Sets the subtitle with tabular figures because it is data (a time, a host), not prose. */
  subtitleIsData?: boolean;
  /** Time column: start time and optional end time. */
  leading?: string;
  leadingDetail?: string;
  /** Date column; `null` repeats the previous row's day as a blank ("ditto") cell. */
  day?: { weekday: string; day: string } | null;
  /** Right-hand data column on wide screens; folded into the subtitle on phones. */
  aside?: string;
  status?: RowStatus;
  /** Past entries: set in muted ink but still fully readable. */
  dimmed?: boolean;
};

export type ResourceListItemVariant = "standard" | "event" | "timeline" | "card";

export type ResourceListItemProps<T> = {
  item: T;
  href: (item: T) => { pathname: string; params: Record<string, string> };
  renderCard: (item: T) => ResourceListContent;
  accessibilityLabel: (item: T) => string;
  onNavigate?: (item: T) => void;
  variant?: ResourceListItemVariant;
  minHeight?: number;
};

type Theme = ReturnType<typeof useTheme>;

const ASIDE_BREAKPOINT = 600;

function TimeCell({ content, theme }: { content: ResourceListContent; theme: Theme }): JSX.Element {
  const ink = content.dimmed ? theme.colors.muted : theme.colors.text;
  return (
    <View testID="resource-timeline-time" style={styles.leading}>
      <Text style={[styles.leadingTime, { color: ink }]}>{content.leading}</Text>
      {content.leadingDetail ? (
        <Text style={[styles.leadingDetail, { color: theme.colors.muted }]}>{content.leadingDetail}</Text>
      ) : null}
    </View>
  );
}

function DayCell({ day, theme }: { day: ResourceListContent["day"]; theme: Theme }): JSX.Element {
  return (
    <View testID="resource-day" style={styles.leading}>
      {day ? (
        <>
          <Text style={[styles.dayWeekday, { color: theme.colors.muted }]}>{day.weekday}</Text>
          <Text style={[styles.dayNumber, { color: theme.colors.text }]}>{day.day}</Text>
        </>
      ) : null}
    </View>
  );
}

/** The row's state: "now" is a flat orange chip, "next" an outlined one, "ended" a muted word. */
function StatusCell({ status, theme }: { status: RowStatus; theme: Theme }): JSX.Element {
  const { colors } = theme;
  const chip = {
    now: { color: colors.signalText, backgroundColor: colors.signal, borderColor: colors.signal },
    next: { color: colors.text, backgroundColor: "transparent", borderColor: colors.text },
    ended: { color: colors.muted, backgroundColor: "transparent", borderColor: "transparent" },
  }[status.kind];
  return (
    <View testID="resource-row-status" style={styles.status}>
      <Text numberOfLines={1} style={[styles.tag, chip]}>{status.label}</Text>
    </View>
  );
}

/** An event card: date and time above, the title in light weight, and a round arrow at the foot. */
function ResourceCard({ content, hovered, theme }: { content: ResourceListContent; hovered: boolean; theme: Theme }): JSX.Element {
  const { colors } = theme;
  const date = content.day ? `${content.day.weekday} ${content.day.day}` : content.leading;
  return (
    <View testID="resource-row" style={[styles.card, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <View style={styles.cardHead}>
        <Text style={[styles.cardMeta, { color: colors.text }]}>{date}</Text>
        {content.aside ? <Text style={[styles.cardMeta, { color: colors.muted }]}>{content.aside}</Text> : null}
      </View>
      <View style={styles.cardBody}>
        <Text numberOfLines={4} style={[styles.cardTitle, hovered && styles.titleHovered, { color: colors.text }]}>{content.title}</Text>
        {content.subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{content.subtitle}</Text> : null}
      </View>
      <ArrowCircle color={colors.text} />
    </View>
  );
}

/** Title and subtitle; on phones the aside becomes its own line instead of a right-hand column. */
function RowCopy({ content, foldAside, hovered, theme }: { content: ResourceListContent; foldAside: boolean; hovered: boolean; theme: Theme }): JSX.Element {
  const muted = { color: theme.colors.muted };
  return (
    <View testID="resource-row-copy" style={styles.copy}>
      <Text numberOfLines={3} style={[styles.title, hovered && styles.titleHovered, { color: content.dimmed ? theme.colors.muted : theme.colors.text }]}>
        {content.title}
      </Text>
      {content.subtitle ? (
        <Text numberOfLines={3} style={[content.subtitleIsData ? styles.subtitleData : styles.subtitle, muted]}>
          {content.subtitle}
        </Text>
      ) : null}
      {foldAside && content.aside ? <Text numberOfLines={1} style={[styles.asideFolded, muted]}>{content.aside}</Text> : null}
    </View>
  );
}

type RowProps = {
  content: ResourceListContent;
  variant: ResourceListItemVariant;
  pressed: boolean;
  hovered: boolean;
  theme: Theme;
  minHeight: number;
  wide: boolean;
};

function ResourceListRow({ content, variant, pressed, hovered, theme, minHeight, wide }: RowProps): JSX.Element {
  const showAside = wide && Boolean(content.aside);
  return (
    <View
      testID="resource-row"
      style={[
        styles.row,
        {
          minHeight,
          borderTopColor: theme.colors.border,
          borderTopWidth: theme.ui.borderWidth,
          backgroundColor: getResourceRowBackground(theme, pressed, false),
        },
      ]}
    >
      {variant === "timeline" ? <TimeCell content={content} theme={theme} /> : null}
      {variant === "event" ? <DayCell day={content.day} theme={theme} /> : null}
      <RowCopy content={content} foldAside={!wide} hovered={hovered} theme={theme} />
      {showAside ? <Text numberOfLines={2} style={[styles.aside, { color: theme.colors.muted }]}>{content.aside}</Text> : null}
      {content.status ? <StatusCell status={content.status} theme={theme} /> : null}
    </View>
  );
}

function ResourceListItemInner<T>({
  item,
  href,
  renderCard,
  accessibilityLabel,
  onNavigate,
  variant = "standard",
  minHeight,
}: ResourceListItemProps<T>): JSX.Element {
  const theme = useTheme();
  const metrics = useDesignMetrics();
  const wide = useHydratedWindowWidth() >= ASIDE_BREAKPOINT;
  const content = renderCard(item);
  const navigating = useRef(false);
  const handlePress = useCallback<NonNullable<ComponentProps<typeof Link>["onPress"]>>((event) => {
    if (navigating.current) {
      event.preventDefault();
      return;
    }
    navigating.current = true;
    onNavigate?.(item);
    setTimeout(() => { navigating.current = false; }, 500);
  }, [item, onNavigate]);

  return (
    <Link href={href(item)} onPress={handlePress} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={accessibilityLabel(item)} style={styles.link}>
        {(state) => variant === "card" ? (
          <ResourceCard content={content} hovered={(state as { hovered?: boolean }).hovered === true} theme={theme} />
        ) : (
          <ResourceListRow
            content={content}
            variant={variant}
            pressed={state.pressed}
            hovered={(state as { hovered?: boolean }).hovered === true}
            theme={theme}
            minHeight={minHeight ?? metrics.rowMinHeight}
            wide={wide}
          />
        )}
      </Pressable>
    </Link>
  );
}

export const ResourceListItem = React.memo(ResourceListItemInner) as typeof ResourceListItemInner;
