/** Renders localized result-count feedback for event search and sorting. */
import { StyleSheet, Text } from "react-native";
import { typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeContext";
import { useLocale } from "@/localization/LocaleContext";

const styles = StyleSheet.create({
  resultCount: {
    ...typography.caption,
    flex: 1,
  },
});

/** Announces the filtered event count after loading completes, without duplicating empty-state copy. */
export function EventResultCount({
  loading,
  resultCount,
  search
}: {
  loading: boolean;
  resultCount: number;
  search: string;
}): JSX.Element | null {
  const theme = useTheme();
  const { t } = useLocale();
  if (loading) return null;
  return (
    <Text accessibilityLiveRegion="polite" style={[styles.resultCount, { color: theme.colors.muted }]}>
      {t(resultCount === 1 ? "eventResultCountOne" : "eventResultCountOther", { count: resultCount })}
      {search ? `: ${search}` : ""}
    </Text>
  );
}
