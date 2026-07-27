/** Renders accessible resource-ledger links with standard and time-column variants. */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link } from "expo-router";
import React, { type ComponentProps, useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocale } from "../i18n/LocaleContext";
import { getDesignPreset } from "./designPresets";
import { spacing, typography, withOpacity } from "./theme";
import { useTheme } from "./ThemeContext";

export type ResourceListContent = {
  title: string;
  subtitle?: string;
  leading?: string;
  /** Optional status chip (e.g. “Next up”); timeline + active also defaults one. */
  badge?: string;
};

export type ResourceListItemVariant = "standard" | "route" | "timeline";

export type ResourceListItemProps<T> = {
  item: T;
  href: (item: T) => { pathname: string; params: Record<string, string> };
  renderCard: (item: T) => ResourceListContent;
  accessibilityLabel: (item: T) => string;
  onNavigate?: (item: T) => void;
  variant?: ResourceListItemVariant;
  active?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  minHeight?: number;
  open?: boolean;
};

const SPINE_DOT_SIZE = 11;
const SPINE_RING_PAD = 4;

/** Resolves the quiet active and tactile pressed surface colors for a resource ticket. */
function getResourceRowBackground(
  theme: ReturnType<typeof useTheme>,
  pressed: boolean,
  active: boolean,
  open: boolean,
  timeline: boolean
): string {
  if (pressed) {
    if (timeline && active) return withOpacity(theme.colors.signal, 0.28);
    return withOpacity(theme.colors.accent, 0.10);
  }
  // Timeline “next” wash outranks open transparent so the active spine stays legible.
  if (timeline && active) return withOpacity(theme.colors.signal, 0.18);
  if (open) return "transparent";
  if (active) return withOpacity(theme.colors.accent, 0.07);
  return theme.colors.surface;
}

function ResourceListItemInner<T>({
  item,
  href,
  renderCard,
  accessibilityLabel,
  onNavigate,
  variant = "standard",
  active = false,
  isFirst = false,
  isLast: _isLast = false,
  minHeight,
  open = false,
}: ResourceListItemProps<T>): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const metrics = getDesignPreset(theme.designPreset).metrics;
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
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={accessibilityLabel(item)}
        style={styles.link}
      >
        {({ pressed }) => (
          <ResourceListRow
            content={content}
            variant={variant}
            active={active}
            isFirst={isFirst}
            pressed={pressed}
            theme={theme}
            minHeight={minHeight ?? metrics.rowMinHeight}
            open={open}
            defaultNextBadge={t("nextUp")}
          />
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: { width: "100%" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowDivider: { borderBottomWidth: 1 },
  copy: { flex: 1, minWidth: 0 },
  title: { ...typography.body, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { ...typography.caption, marginTop: 3 },
  badge: {
    ...typography.small,
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  timelineTimeColumn: {
    width: 72,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  timelineTime: {
    ...typography.caption,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  spineSlot: {
    width: SPINE_DOT_SIZE + SPINE_RING_PAD * 2,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  spineRing: {
    padding: SPINE_RING_PAD,
    borderRadius: 9999,
  },
  spineDot: {
    width: SPINE_DOT_SIZE,
    height: SPINE_DOT_SIZE,
    borderRadius: SPINE_DOT_SIZE / 2,
    borderWidth: 2,
  },
});

/** Draws the responsive row body separately from the Pressable state callback. */
const ResourceListRow = ({
  content,
  variant,
  active,
  isFirst,
  pressed,
  theme,
  minHeight,
  open,
  defaultNextBadge,
}: {
  content: ResourceListContent;
  variant: ResourceListItemVariant;
  active: boolean;
  isFirst: boolean;
  pressed: boolean;
  theme: ReturnType<typeof useTheme>;
  minHeight: number;
  open: boolean;
  defaultNextBadge: string;
}): JSX.Element => {
  const timeline = variant === "timeline";
  const badgeText = content.badge ?? (timeline && active ? defaultNextBadge : undefined);

  return (
    <View
      testID="resource-row"
      style={[
        styles.row,
        styles.rowDivider,
        {
          minHeight,
          borderColor: theme.colors.border,
          borderTopWidth: isFirst ? theme.ui.borderWidth : 0,
          borderBottomWidth: theme.ui.borderWidth,
          backgroundColor: getResourceRowBackground(theme, pressed, active, open, timeline),
        },
      ]}
    >
      {timeline ? (
        <View testID="resource-timeline-time" style={styles.timelineTimeColumn}>
          <Text numberOfLines={2} style={[styles.timelineTime, { color: theme.colors.text }]}>
            {content.leading}
          </Text>
        </View>
      ) : null}
      {timeline ? <TimelineSpineDot active={active} theme={theme} /> : null}
      <View testID="resource-row-copy" style={styles.copy}>
        <Text numberOfLines={2} style={[styles.title, { color: theme.colors.text }]}>
          {content.title}
        </Text>
        {content.subtitle ? (
          <Text numberOfLines={2} style={[styles.subtitle, { color: theme.colors.muted }]}>
            {content.subtitle}
          </Text>
        ) : null}
        {badgeText ? (
          <Text
            testID="resource-row-badge"
            numberOfLines={1}
            style={[
              styles.badge,
              {
                color: theme.colors.signalText,
                backgroundColor: withOpacity(theme.colors.signal, 0.22),
              },
            ]}
          >
            {badgeText}
          </Text>
        ) : null}
      </View>
      <MaterialIcons testID="resource-row-chevron" name="chevron-right" size={24} color={theme.colors.muted} />
    </View>
  );
};

/** Quiet Chronograph spine marker: empty rail circle, filled signal when next. */
function TimelineSpineDot({
  active,
  theme,
}: {
  active: boolean;
  theme: ReturnType<typeof useTheme>;
}): JSX.Element {
  const wash = withOpacity(theme.colors.signal, 0.18);
  return (
    <View testID="resource-spine-dot" style={styles.spineSlot} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.spineRing, active ? { backgroundColor: wash } : null]}>
        <View
          style={[
            styles.spineDot,
            active
              ? { backgroundColor: theme.colors.signal, borderColor: theme.colors.signal }
              : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        />
      </View>
    </View>
  );
}

export const ResourceListItem = React.memo(ResourceListItemInner) as typeof ResourceListItemInner;
