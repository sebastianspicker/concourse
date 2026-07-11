import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../ui/theme";
import { useTheme } from "../ui/ThemeContext";
import { formatCacheAge } from "./cacheAge";

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

export function OfflineBanner({
  topPadding,
  hasOfflineData,
  showCacheAge,
}: {
  topPadding: number;
  hasOfflineData: boolean;
  showCacheAge: boolean;
}): JSX.Element {
  const theme = useTheme();

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

export function CachedDataBanner({
  topPadding,
  cacheAge,
}: {
  topPadding: number;
  cacheAge: number | null;
}): JSX.Element {
  const theme = useTheme();
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
