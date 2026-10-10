/** Renders the event list head: result count, the sort control, and the heavy board rule. */
import { StyleSheet, Text, View } from "react-native";
import { SortButton, type SortDirection } from "@/design-system/SortButton";
import { spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeProvider";
import { useLocale } from "@/localization/LocaleContext";

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingBottom: spacing.xs,
    minHeight: 48,
  },
  resultCount: { ...typography.caption, flex: 1, paddingBottom: spacing.sm },
});

const EVENT_SORT_LABEL_KEYS = { asc: "sortEventsAscending", desc: "sortEventsDescending" } as const;

/** Announces the filtered event count after loading completes, without duplicating empty-state copy. */
function EventResultCount({
  loading,
  resultCount,
  search
}: {
  loading: boolean;
  resultCount: number;
  search: string;
}): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  return (
    <Text accessibilityLiveRegion="polite" style={[styles.resultCount, { color: theme.colors.muted }]}>
      {loading ? "" : t(resultCount === 1 ? "eventResultCountOne" : "eventResultCountOther", { count: resultCount })}
      {!loading && search ? ` · “${search}”` : ""}
    </Text>
  );
}

export function EventListControls({
  loading,
  resultCount,
  search,
  sortDirection,
  onToggleSort,
}: {
  loading: boolean;
  resultCount: number;
  search: string;
  sortDirection: SortDirection;
  onToggleSort: () => void;
}): JSX.Element {
  return (
    <View style={styles.controls}>
      <EventResultCount loading={loading} resultCount={resultCount} search={search} />
      <SortButton
        sortDirection={sortDirection}
        onToggleSort={onToggleSort}
        labelKeys={EVENT_SORT_LABEL_KEYS}
        accessibilityKey="sortEventsAccessibility"
        variant="inline"
      />
    </View>
  );
}
