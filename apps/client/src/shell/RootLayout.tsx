/** Bootstraps application-wide theme, locale, safe-area, error, and root navigation providers. */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/shell/ErrorBoundary";
import { OfflineIndicator } from "@/shell/OfflineIndicator";
import { SignalHeader } from "@/shell/SignalHeader";
import { ThemeProvider, useTheme } from "@/design-system/ThemeProvider";
import { fontAssets } from "@/design-system/fontAssets";
import { LocaleProvider, useLocale } from "@/localization/LocaleContext";
import { getInstitutionDisplayName } from "@/platform/env/institution";
import { isStaticDemo } from "@/data/public/staticDemo";
import { getWebThemeCss } from "@/design-system/webMotion";
import { usePublicDataRecovery } from "@/data/public/usePublicDataRecovery";

/** Installs root providers and navigation for every mobile route. */
export default function RootLayout(): JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({ ...MaterialIcons.font, ...fontAssets });
  usePublicDataRecovery();
  const staticDemo = isStaticDemo();

  // Native text measures against the real font; web renders the fallback stack until the
  // bundled files arrive so static HTML is never blank.
  if (Platform.OS !== "web" && !fontsLoaded && !fontError) return null;

  return (
    <>
      <Head>
        <title>{`${getInstitutionDisplayName()} · Concourse`}</title>
        <meta name="description" content="What is on now, next, and where: public campus events, rooms, and schedules." />
      </Head>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedDocument />
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

/** Publishes theme-aware document CSS (canvas, focus ring, reduced motion) on the web. */
function ThemedDocument(): JSX.Element {
  const theme = useTheme();
  return (
    <Head>
      <meta name="theme-color" content={theme.colors.background} />
      <style>{getWebThemeCss(theme)}</style>
    </Head>
  );
}

/** Registers detail routes with localized titles and browser-only fallback navigation. */
function AppNavigator(): JSX.Element {
  const { t } = useLocale();
  const theme = useTheme();

  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="events/[id]" options={{ title: t("events"), header: () => <SignalHeader backFallback="/(tabs)/events" /> }} />
      <Stack.Screen name="rooms/[id]/index" options={{ title: t("rooms"), header: () => <SignalHeader backFallback="/(tabs)/rooms" /> }} />
      <Stack.Screen name="schedule/[id]" options={{ title: t("schedule"), header: () => <SignalHeader backFallback="/(tabs)" /> }} />
    </Stack>
  );
}
