import { Stack } from "expo-router";
import { SignalHeader } from "@/shell/SignalHeader";
import { useLocale } from "@/localization/LocaleContext";
import { useTheme } from "@/design-system/ThemeContext";

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
