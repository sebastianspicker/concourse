import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { OfflineIndicator } from "../src/components/OfflineIndicator";
import { ThemeProvider } from "../src/ui/ThemeContext";
import { LocaleProvider } from "../src/i18n/LocaleContext";
import { getInstitutionDisplayName } from "../src/config/institution";

export default function RootLayout(): JSX.Element {
  useFonts(MaterialIcons.font);

  return (
    <>
      <Head>
        <title>{`${getInstitutionDisplayName()} — Campus Desk`}</title>
        <meta name="description" content="Current public campus events, rooms, and schedules." />
      </Head>
      <SafeAreaProvider>
        <ThemeProvider>
          <LocaleProvider>
            <ErrorBoundary>
              <OfflineIndicator />
              <Stack screenOptions={{ headerShown: true }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="events/[id]" options={{ title: "Event" }} />
                <Stack.Screen name="rooms/[id]/index" options={{ title: "Room" }} />
                <Stack.Screen name="schedule/[id]" options={{ title: "Schedule" }} />
              </Stack>
            </ErrorBoundary>
          </LocaleProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </>
  );
}
