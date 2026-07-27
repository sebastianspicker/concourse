/** Defines primary routes beneath the shared Signal Board application header. */
import { Stack } from "expo-router";
import { SignalHeader } from "@/components/SignalHeader";
import { useLocale } from "@/i18n/LocaleContext";
import { useTheme } from "@/ui/ThemeContext";

/** Configures the route set while the shared header owns visible navigation. */
export default function TabsLayout(): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();

  return (
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
  );
}
