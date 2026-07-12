import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import React from "react";
import { useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocale } from "@/i18n/LocaleContext";
import { useTheme } from "@/ui/ThemeContext";

const icons = {
  index: "today",
  events: "event",
  rooms: "meeting-room",
  settings: "settings",
} as const;

export default function TabsLayout(): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarActiveTintColor: theme.colors.accentText,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarActiveBackgroundColor: theme.colors.accent,
        tabBarInactiveBackgroundColor: theme.colors.surface,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderRightColor: theme.colors.border,
          paddingBottom: isWide ? 8 : Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: isWide ? undefined : 56 + Math.max(insets.bottom, 8),
        },
        tabBarPosition: isWide ? "left" : "bottom",
        tabBarLabelPosition: isWide ? "beside-icon" : "below-icon",
        tabBarIcon: ({ color, size }) => {
          const name = icons[route.name as keyof typeof icons] ?? "circle";
          return <View testID={`tab-${route.name}`}><MaterialIcons name={name} color={color} size={size} /></View>;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: t("today") }} />
      <Tabs.Screen name="events" options={{ title: t("events") }} />
      <Tabs.Screen name="rooms" options={{ title: t("rooms") }} />
      <Tabs.Screen name="settings" options={{ title: t("settings") }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
