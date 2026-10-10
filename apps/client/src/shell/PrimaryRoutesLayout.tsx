import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { HEADER_NAVIGATION_BREAKPOINT, SignalHeader } from "@/shell/SignalHeader";
import { PlatformBar } from "@/shell/SignalNav";
import { useLocale } from "@/localization/LocaleContext";
import { useTheme } from "@/design-system/ThemeProvider";
import { useHydratedWindowWidth } from "@/design-system/useHydratedWindowWidth";

export default function TabsLayout(): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const width = useHydratedWindowWidth();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Stack
        screenOptions={{
          header: () => <SignalHeader />,
          headerShown: true,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: t("today") }} />
        <Stack.Screen name="events" options={{ title: t("events") }} />
        <Stack.Screen name="rooms" options={{ title: t("rooms") }} />
        <Stack.Screen name="settings" options={{ title: t("settings") }} />
        <Stack.Screen name="profile" options={{ title: t("settings") }} />
      </Stack>
      {width < HEADER_NAVIGATION_BREAKPOINT ? <PlatformBar /> : null}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
