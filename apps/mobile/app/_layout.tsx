import "@/global.css";
import { Stack } from "expo-router";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { OfflineIndicator } from "../src/components/OfflineIndicator";
import { ThemeProvider } from "../src/ui/ThemeContext";

export default function RootLayout(): JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <OfflineIndicator />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
          </Stack>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
