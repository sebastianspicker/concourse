import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, AppState, AppStateStatus, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOfflineCache } from "../hooks/useOfflineCache";
import { spacing, typography } from "../ui/theme";
import { useTheme } from "../ui/ThemeContext";

type Props = {
  showCacheAge?: boolean;
};

export function OfflineIndicator({ showCacheAge = true }: Props): JSX.Element | null {
  const { isOffline, hasOfflineData, cacheAge } = useOfflineCache();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  // Don't show when app is in background
  if (appState !== "active") return null;

  const topPadding = Platform.OS === "ios" ? insets.top : 0;

  // Show when device is offline
  if (isOffline) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.error, paddingTop: topPadding + 8 },
        ]}
      >
        <Text style={[styles.text, { color: "#ffffff" }]}>
          📡 You are offline
        </Text>
        {hasOfflineData && showCacheAge && (
          <Text style={[styles.subtext, { color: "rgba(255,255,255,0.85)" }]}>
            Showing cached data
          </Text>
        )}
      </View>
    );
  }

  // Show when displaying cached offline data
  if (hasOfflineData) {
    const ageText = cacheAge ? formatCacheAge(cacheAge) : "";
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.warning, paddingTop: topPadding + 8 },
        ]}
      >
        <Text style={[styles.text, { color: "#1b1a17" }]}>
          Offline data{ageText ? ` (${ageText})` : ""}
        </Text>
      </View>
    );
  }

  return null;
}

function formatCacheAge(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d old`;
  if (hours > 0) return `${hours}h old`;
  if (minutes > 0) return `${minutes}m old`;
  return "just now";
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    ...typography.caption,
    fontWeight: "600",
  },
  subtext: {
    ...typography.small,
    marginTop: 2,
  },
});
