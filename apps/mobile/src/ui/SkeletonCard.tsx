import React from "react";
import { StyleSheet, View } from "react-native";
import { scaled, scaledRadius, spacing } from "./theme";
import { useTheme } from "./ThemeContext";
import { Skeleton } from "./SkeletonPrimitive";

const styles = StyleSheet.create({
  card: {
    borderCurve: "continuous",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardContent: {
    gap: spacing.xs,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  badge: {
    marginLeft: spacing.sm,
  },
  iconLabel: {
    marginLeft: spacing.xs,
  },
  listContainer: {
    paddingVertical: spacing.xs,
  },
  listItem: {
    marginBottom: spacing.sm,
  },
});

export function SkeletonCard(): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: ui.borderWidth,
          borderRadius: scaledRadius(12, ui),
          padding: scaled(spacing.md, ui),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Skeleton width="60%" height={18} borderRadius={4} />
        <Skeleton width={80} height={14} borderRadius={4} style={styles.badge} />
      </View>
      <View style={styles.cardContent}>
        <Skeleton width="80%" height={14} borderRadius={4} />
        <View style={styles.cardRow}>
          <Skeleton width={16} height={16} borderRadius={8} />
          <Skeleton width="40%" height={12} borderRadius={4} style={styles.iconLabel} />
        </View>
        <View style={styles.cardRow}>
          <Skeleton width={16} height={16} borderRadius={8} />
          <Skeleton width="50%" height={12} borderRadius={4} style={styles.iconLabel} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }): JSX.Element {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}
