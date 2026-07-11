import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { EdgeInsets } from "react-native-safe-area-context";
import { getTabBarOptions } from "@/screens/tabsBarOptions";
import { getHeaderOptions } from "@/screens/tabsHeaderOptions";
import type { useTheme } from "@/ui/ThemeContext";

type Theme = ReturnType<typeof useTheme>;

export function getTabsScreenOptions(theme: Theme, insets: EdgeInsets): object {
  return { ...getHeaderOptions(theme), ...getTabBarOptions(theme, insets) };
}

export function getTabOptions(title: string, icon: string): object {
  return {
    title,
    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
      <TabIcon icon={icon} focused={focused} color={color} />
    )
  };
}

function TabIcon({ icon, focused, color }: { icon: string; focused: boolean; color: string }): JSX.Element {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, { color, opacity: focused ? 1 : 0.55 }]}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 24
  },
  tabIcon: { fontSize: 20 }
});
