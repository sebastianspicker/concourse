import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/ui/ThemeContext";

type TabIconProps = {
  icon: string;
  focused: boolean;
  color: string;
};

function TabIcon({ icon, focused, color }: TabIconProps): JSX.Element {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, { color, opacity: focused ? 1 : 0.55 }]}>
        {icon}
      </Text>
    </View>
  );
}

export default function TabsLayout(): JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.background,
          ...Platform.select({
            ios: {
              shadowColor: "transparent",
            },
            android: {
              elevation: 0,
            },
          }),
        },
        headerTitleStyle: {
          color: theme.colors.text,
          fontWeight: "700",
          fontSize: 17,
          letterSpacing: -0.3,
        },
        headerTintColor: theme.colors.accent,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: theme.ui.borderWidth,
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 8,
          paddingTop: 6,
          height: Platform.OS === "ios" ? 52 + insets.bottom : 60,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.1,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="🏠" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="🎪" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Rooms",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="🏢" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="👤" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 24,
  },
  tabIcon: {
    fontSize: 20,
  },
});
