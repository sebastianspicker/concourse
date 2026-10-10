/** Provides the responsive screen shell, scroll behavior, and pull-to-refresh wiring. */
import React from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { CONTENT_MAX_WIDTH, spacing } from "./theme";
import { useTheme, useDesignMetrics } from "./ThemeProvider";
import { useHydratedWindowWidth } from "./useHydratedWindowWidth";

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  scrollContent: {
    flexGrow: 1,
  },
  content: {},
  nonScrolling: { flex: 1 },
});

/** Returns the horizontal gutter for the current width, shared by the header and screen bodies. */
export function useContentGutter(): number {
  const width = useHydratedWindowWidth();
  const metrics = useDesignMetrics();
  if (width < 600) return metrics.compactGutter;
  return width < 900 ? metrics.regularGutter : metrics.wideGutter;
}

/** Provides responsive gutters, optional scrolling, and native pull-to-refresh for a screen body. */
export function Screen({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  maxWidth = CONTENT_MAX_WIDTH,
  backgroundColor,
  contentPadding,
  testID,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  maxWidth?: number;
  backgroundColor?: string;
  contentPadding?: number;
  testID?: string;
}): JSX.Element {
  const theme = useTheme();
  const metrics = useDesignMetrics();
  const gutter = useContentGutter();

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.colors.accent}
      colors={[theme.colors.accent]}
      progressBackgroundColor={theme.colors.surface}
    />
  ) : undefined;

  const resolvedContentPadding = contentPadding ?? gutter;

  const contentStyle = [
    styles.content,
    {
      width: "100%" as const,
      maxWidth,
      alignSelf: "center" as const,
      paddingHorizontal: resolvedContentPadding,
      paddingTop: Math.min(resolvedContentPadding, spacing.xxl),
      paddingBottom: resolvedContentPadding + spacing.huge,
      gap: metrics.contentGap,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: backgroundColor ?? theme.colors.background }]} testID={testID}>
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[contentStyle, styles.nonScrolling]}>{children}</View>
      )}
    </View>
  );
}
