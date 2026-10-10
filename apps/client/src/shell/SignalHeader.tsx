/** Masthead: the wordmark, navigation, and the freshness status on a plain white bar. */
import { type Href } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CONTENT_MAX_WIDTH, spacing } from "@/design-system/theme";
import { useContentGutter } from "@/design-system/Screen";
import { useTheme } from "@/design-system/ThemeProvider";
import { useHydratedWindowWidth } from "@/design-system/useHydratedWindowWidth";
import { ChromeFreshnessChip } from "./ChromeFreshnessChip";
import { SignalIdentity } from "./SignalIdentity";
import { SignalNav } from "./SignalNav";
import { StaticDemoNotice } from "./StaticDemoNotice";

/** Width at which navigation moves from the bottom bar into the masthead. */
export const HEADER_NAVIGATION_BREAKPOINT = 900;

export function SignalHeader({ backFallback }: { backFallback?: Href }): JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const width = useHydratedWindowWidth();
  const desktop = width >= HEADER_NAVIGATION_BREAKPOINT;
  const gutter = useContentGutter();

  return (
    <View
      style={[
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
        theme.colorScheme === "highContrast" && { borderBottomColor: theme.colors.text, borderBottomWidth: theme.ui.borderWidth },
      ]}
    >
      <View style={[styles.row, { paddingHorizontal: gutter, minHeight: desktop ? 76 : 60 }]}>
        <SignalIdentity backFallback={backFallback} compact={!desktop} />
        {desktop ? <SignalNav /> : null}
        <View style={styles.status}>
          <ChromeFreshnessChip />
        </View>
      </View>
      <StaticDemoNotice gutter={gutter} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxl,
  },
  status: { marginLeft: "auto", flexShrink: 1, alignItems: "flex-end" },
});
