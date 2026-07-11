import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTabOptions, getTabsScreenOptions } from "@/screens/tabsLayoutOptions";
import { useTheme } from "@/ui/ThemeContext";

export default function TabsLayout(): JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={getTabsScreenOptions(theme, insets)}>
    <Tabs.Screen name="index" options={getTabOptions("Today", "🏠")} />
    <Tabs.Screen name="events" options={getTabOptions("Events", "🎪")} />
    <Tabs.Screen name="rooms" options={getTabOptions("Rooms", "🏢")} />
    <Tabs.Screen name="profile" options={getTabOptions("Profile", "👤")} />
  </Tabs>;
}
