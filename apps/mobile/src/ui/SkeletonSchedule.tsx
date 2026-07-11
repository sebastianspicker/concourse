import React from "react";
import { StyleSheet, View } from "react-native";
import { scaled, scaledRadius, spacing } from "./theme";
import { useTheme } from "./ThemeContext";
import { Skeleton } from "./SkeletonPrimitive";

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: spacing.xs,
  },
  listItem: {
    marginBottom: spacing.sm,
  },
  scheduleItem: {
    flexDirection: "row",
    borderCurve: "continuous",
  },
  scheduleTime: {
    width: 70,
    paddingRight: spacing.sm,
  },
  timeEnd: {
    marginTop: spacing.xs,
  },
  scheduleContent: {
    flex: 1,
    paddingLeft: spacing.md,
    gap: spacing.xs,
  },
  scheduleLocation: {
    marginTop: spacing.xs,
  },
});

export function SkeletonScheduleItem(): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <View
      style={[
        styles.scheduleItem,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: ui.borderWidth,
          borderRadius: scaledRadius(12, ui),
          padding: scaled(spacing.md, ui),
        },
      ]}
    >
      <View
        style={[
          styles.scheduleTime,
          {
            borderRightWidth: ui.borderWidth,
            borderRightColor: theme.colors.border,
          },
        ]}
      >
        <Skeleton width={50} height={14} borderRadius={4} />
        <Skeleton width={40} height={12} borderRadius={4} style={styles.timeEnd} />
      </View>
      <View style={styles.scheduleContent}>
        <Skeleton width="70%" height={16} borderRadius={4} />
        <Skeleton width="50%" height={12} borderRadius={4} style={styles.scheduleLocation} />
      </View>
    </View>
  );
}

export function SkeletonSchedule({ count = 4 }: { count?: number }): JSX.Element {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <SkeletonScheduleItem />
        </View>
      ))}
    </View>
  );
}
