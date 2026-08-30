/** Bootstraps application-wide theme, locale, safe-area, error, and root navigation providers. */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/shell/ErrorBoundary";
import { OfflineIndicator } from "@/shell/OfflineIndicator";
import { SignalHeader } from "@/shell/SignalHeader";
import { ThemeProvider } from "@/design-system/ThemeContext";
import { LocaleProvider, useLocale } from "@/localization/LocaleContext";
import { getInstitutionDisplayName } from "@/platform/env/institution";
import { isStaticDemo } from "@/data/public/staticDemo";
import { webMotionCss } from "@/design-system/webMotion";

/** Installs root providers and navigation for every mobile route. */
export default function RootLayout(): JSX.Element {
  useFonts(MaterialIcons.font);
  const staticDemo = isStaticDemo();

  return (
    <>
      <Head>
        <title>{`${getInstitutionDisplayName()} - Concourse`}</title>
        <meta name="description" content="Current public campus events, rooms, and schedules." />
        <style>{webMotionCss}</style>
      </Head>
      <SafeAreaProvider>
        <ThemeProvider>
          <LocaleProvider>
            <ErrorBoundary>
              {!staticDemo && <OfflineIndicator />}
              <AppNavigator />
            </ErrorBoundary>
          </LocaleProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </>
  );
}

/** Registers detail routes with localized titles and browser-only fallback navigation. */
function AppNavigator(): JSX.Element {
  const { t } = useLocale();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="events/[id]" options={{ title: t("events"), header: () => <SignalHeader backFallback="/(tabs)/events" /> }} />
      <Stack.Screen name="rooms/[id]/index" options={{ title: t("rooms"), header: () => <SignalHeader backFallback="/(tabs)/rooms" /> }} />
      <Stack.Screen name="schedule/[id]" options={{ title: t("schedule"), header: () => <SignalHeader backFallback="/(tabs)" /> }} />
    </Stack>
  );
}
