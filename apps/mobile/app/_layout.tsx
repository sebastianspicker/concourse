/** Bootstraps application-wide theme, locale, safe-area, error, and root navigation providers. */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { OfflineIndicator } from "../src/components/OfflineIndicator";
import { SignalHeader } from "../src/components/SignalHeader";
import { ThemeProvider } from "../src/ui/ThemeContext";
import { LocaleProvider, useLocale } from "../src/i18n/LocaleContext";
import { getInstitutionDisplayName } from "../src/config/institution";
import { webMotionCss } from "../src/ui/webMotion";

/** Installs root providers and navigation for every mobile route. */
export default function RootLayout(): JSX.Element {
  useFonts(MaterialIcons.font);

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
              <OfflineIndicator />
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
