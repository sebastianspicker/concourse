/** Primary destinations: a header row on wide screens and a bottom platform bar on phones. */
import { Link, usePathname, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocale } from "@/localization/LocaleContext";
import type { TranslationKey } from "@/localization/dictionaries";
import { fonts, spacing } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeProvider";

export type DestinationKey = "today" | "events" | "rooms" | "settings";

export type Destination = {
  href: Href;
  key: DestinationKey;
  match: string;
  labelKey: TranslationKey;
};

export const destinations: Destination[] = [
  { href: "/(tabs)", key: "today", match: "/(tabs)", labelKey: "today" },
  { href: "/(tabs)/events", key: "events", match: "/events", labelKey: "eventsTab" },
  { href: "/(tabs)/rooms", key: "rooms", match: "/rooms", labelKey: "rooms" },
  { href: "/(tabs)/settings", key: "settings", match: "/settings", labelKey: "settings" },
];

export function isDestinationActive(
  pathname: string,
  key: DestinationKey,
  match: string,
): boolean {
  if (key === "today") {
    return pathname === "/" || pathname === "/(tabs)" || pathname.startsWith("/schedule/");
  }
  return pathname.includes(match);
}

/** One destination: words only. The current one is underlined in the header and marked with a bar on phones. */
function NavItem({ destination, placement }: { destination: Destination; placement: "header" | "bar" }): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const pathname = usePathname();
  const active = isDestinationActive(pathname, destination.key, destination.match);
  const bar = placement === "bar";
  const ink = bar && !active ? theme.colors.muted : theme.colors.text;

  // Link asChild drops function styles, so pressed feedback lives in the render-children.
  return (
    <Link href={destination.href} asChild>
      <Pressable
        accessibilityState={{ selected: active }}
        testID={`tab-${destination.key}`}
        style={bar ? styles.barItem : styles.headerItem}
      >
        {({ pressed }) => (
          <>
            {bar ? (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.barMarker, { backgroundColor: active ? theme.colors.text : "transparent" }]}
              />
            ) : null}
            <Text
              numberOfLines={1}
              style={[styles.label, bar && styles.barLabel, !bar && active && styles.headerActive, { color: ink }, pressed && styles.pressed]}
            >
              {t(destination.labelKey)}
            </Text>
          </>
        )}
      </Pressable>
    </Link>
  );
}

/** Wide-screen navigation inside the header row. */
export function SignalNav(): JSX.Element {
  return (
    <View role="navigation" style={styles.headerNav}>
      {destinations.map((destination) => (
        <NavItem key={destination.key} destination={destination} placement="header" />
      ))}
    </View>
  );
}

/** Phone navigation pinned to the bottom edge, within thumb reach. */
export function PlatformBar(): JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      role="navigation"
      testID="platform-bar"
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: theme.ui.borderWidth,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {destinations.map((destination) => (
        <NavItem key={destination.key} destination={destination} placement="bar" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headerNav: { flexDirection: "row", alignItems: "stretch", gap: spacing.lg },
  headerItem: { minHeight: 44, alignSelf: "stretch", paddingHorizontal: spacing.md, justifyContent: "center", alignItems: "center" },
  headerActive: { textDecorationLine: "underline" },
  label: { fontFamily: fonts.sansSemibold, fontSize: 17, lineHeight: 22 },
  bar: { flexDirection: "row", alignItems: "stretch" },
  barItem: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xs },
  barMarker: { position: "absolute", top: -1, left: "30%", right: "30%", height: 3 },
  barLabel: { fontSize: 14, lineHeight: 18 },
  pressed: { opacity: 0.64 },
});
