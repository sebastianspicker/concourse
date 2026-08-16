/** Quiet Chronograph product chrome: identity, destinations, optional freshness chip. */
import { type Href } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";
import { useHydratedWindowWidth } from "@/ui/useHydratedWindowWidth";
import { ChromeFreshnessChip } from "./ChromeFreshnessChip";
import { SignalIdentity } from "./SignalIdentity";
import { SignalNav } from "./SignalNav";
import { StaticDemoNotice } from "./StaticDemoNotice";

/** Renders the same product chrome for tab and detail routes. */
export function SignalHeader({ backFallback }: { backFallback?: Href }): JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const width = useHydratedWindowWidth();
  const desktop = width >= 900;
  const wideNavigation = width >= 600;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingTop: Math.max(insets.top, spacing.sm),
        },
      ]}
    >
      <View style={[styles.headerInner, desktop && styles.headerInnerDesktop]}>
        {desktop ? (
          <>
            <View style={styles.identitySlotDesktop}>
              <SignalIdentity backFallback={backFallback} />
            </View>
            <SignalNav desktop wideNavigation={wideNavigation} />
            <View style={styles.freshnessSlotDesktop}>
              <ChromeFreshnessChip />
            </View>
          </>
        ) : (
          <>
            <View style={styles.identityRow}>
              <View style={styles.identitySlot}>
                <SignalIdentity backFallback={backFallback} compact />
              </View>
              <View style={styles.freshnessSlot}>
                <ChromeFreshnessChip />
              </View>
            </View>
            <SignalNav wideNavigation={wideNavigation} />
          </>
        )}
      </View>
      <StaticDemoNotice />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInner: {
    width: "100%",
    maxWidth: 1586,
    alignSelf: "center",
  },
  headerInnerDesktop: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  identityRow: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  identitySlot: {
    flex: 1,
    minWidth: 0,
  },
  identitySlotDesktop: {
    flex: 1.1,
    minWidth: 0,
    justifyContent: "center",
  },
  freshnessSlot: {
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  freshnessSlotDesktop: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
