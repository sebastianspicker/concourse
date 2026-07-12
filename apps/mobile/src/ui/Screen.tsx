import React from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { scaled, spacing } from "./theme";
import { useTheme } from "./ThemeContext";

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl * 2,
  },
  content: {},
  nonScrolling: { flex: 1 },
});

export function Screen({
  children,
  scroll = true,
  refreshing = false,
  onRefresh
  ,maxWidth = 760,
  testID
}: {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  maxWidth?: number;
  testID?: string;
}): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.colors.accent}
      colors={[theme.colors.accent]}
      progressBackgroundColor={theme.colors.surface}
    />
  ) : undefined;

  const contentPadding = scaled(spacing.xxl, ui);
  const contentGap = scaled(spacing.xl, ui);

  const contentStyle = [
    styles.content,
    {
      width: "100%" as const,
      maxWidth,
      alignSelf: "center" as const,
      padding: contentPadding,
      gap: contentGap,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]} testID={testID}>
      {scroll ? (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scrollContent,
          contentStyle,
        ]}
        refreshControl={refreshControl}
        scrollEnabled={scroll}
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
