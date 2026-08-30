import { Link, usePathname, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocale } from "@/localization/LocaleContext";
import { spacing } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeContext";

export type DestinationKey = "today" | "events" | "rooms" | "settings";

export type Destination = {
  href: Href;
  key: DestinationKey;
  match: string;
};

export const destinations: Destination[] = [
  { href: "/(tabs)", key: "today", match: "/(tabs)" },
  { href: "/(tabs)/events", key: "events", match: "/events" },
  { href: "/(tabs)/rooms", key: "rooms", match: "/rooms" },
  { href: "/(tabs)/settings", key: "settings", match: "/settings" },
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

export type SignalNavProps = {
  desktop?: boolean;
  wideNavigation?: boolean;
};

export function SignalNav({ desktop = false, wideNavigation = false }: SignalNavProps): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const pathname = usePathname();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={desktop ? styles.navScrollDesktop : undefined}
      contentContainerStyle={[styles.nav, desktop && styles.navDesktop]}
    >
      {destinations.map((destination) => {
        const active = isDestinationActive(pathname, destination.key, destination.match);
        return (
          <Link key={destination.key} href={destination.href} asChild>
            <Pressable
              accessibilityState={{ selected: active }}
              testID={`tab-${destination.key}`}
              style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
            >
              <Text
                style={[
                  styles.navLabel,
                  wideNavigation && styles.navLabelWide,
                  {
                    color: active ? theme.colors.text : theme.colors.muted,
                    fontWeight: active ? "600" : "500",
                  },
                ]}
              >
                {t(destination.key)}
              </Text>
              {active ? (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.underline, { backgroundColor: theme.colors.accent }]}
                />
              ) : null}
            </Pressable>
          </Link>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  navScrollDesktop: { flexGrow: 0, flexShrink: 0 },
  nav: {
    minWidth: "100%",
    paddingHorizontal: spacing.sm,
    justifyContent: "center",
    alignItems: "stretch",
  },
  navDesktop: { minWidth: 0, justifyContent: "center" },
  navItem: {
    minHeight: 44,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    position: "relative",
  },
  navLabel: {
    fontSize: 14,
    lineHeight: 18,
    width: 72,
    paddingVertical: spacing.md,
    textAlign: "center",
    fontWeight: "500",
  },
  navLabelWide: { width: 84 },
  underline: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
    height: 2,
  },
  pressed: { opacity: 0.64 },
});
