import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { scaled, scaledRadius, spacing } from "./theme";
import { useTheme } from "./ThemeContext";

export type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({
  width = 300,
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonProps): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;
  const skeletonHeight = Math.max(2, scaled(height, ui));
  const skeletonRadius = scaledRadius(borderRadius, ui);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer animation - translateX effect
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [animatedValue]);

  // Create shimmer effect using opacity and scale
  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.02, 1],
  });

  const animatedStyle: Animated.WithAnimatedValue<ViewStyle> = {
    width: width as Animated.WithAnimatedValue<ViewStyle>["width"],
    height: skeletonHeight,
    borderRadius: skeletonRadius,
    opacity,
    backgroundColor: theme.colors.muted,
    transform: [{ scaleX: scale }],
  };

  return <Animated.View style={[animatedStyle, style]} />;
}

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

export function SkeletonDetail(): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;
  const sectionStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: ui.borderWidth,
    borderRadius: scaledRadius(12, ui),
    padding: scaled(spacing.md, ui),
  };

  return (
    <View style={styles.detailContainer}>
      {/* Header section */}
      <View style={[styles.detailHeader, sectionStyle]}>
        <Skeleton width="70%" height={28} borderRadius={6} />
        <View style={styles.detailMeta}>
          <Skeleton width={100} height={20} borderRadius={10} style={styles.metaBadge} />
          <Skeleton width={80} height={20} borderRadius={10} style={styles.metaBadge} />
        </View>
      </View>

      {/* Main content section */}
      <View style={[styles.detailSection, sectionStyle]}>
        <Skeleton width="40%" height={16} borderRadius={4} style={styles.sectionTitle} />
        <Skeleton width="100%" height={14} borderRadius={4} />
        <Skeleton width="90%" height={14} borderRadius={4} style={styles.contentLine} />
        <Skeleton width="95%" height={14} borderRadius={4} style={styles.contentLine} />
      </View>

      {/* Info rows */}
      <View style={[styles.detailSection, sectionStyle]}>
        <Skeleton width="30%" height={16} borderRadius={4} style={styles.sectionTitle} />
        <View style={styles.infoRow}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width="60%" height={14} borderRadius={4} style={styles.iconLabel} />
        </View>
        <View style={styles.infoRow}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width="50%" height={14} borderRadius={4} style={styles.iconLabel} />
        </View>
        <View style={styles.infoRow}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width="70%" height={14} borderRadius={4} style={styles.iconLabel} />
        </View>
      </View>

      {/* Description section */}
      <View style={[styles.detailSection, sectionStyle]}>
        <Skeleton width="35%" height={16} borderRadius={4} style={styles.sectionTitle} />
        <Skeleton width="100%" height={14} borderRadius={4} />
        <Skeleton width="85%" height={14} borderRadius={4} style={styles.contentLine} />
        <Skeleton width="92%" height={14} borderRadius={4} style={styles.contentLine} />
        <Skeleton width="75%" height={14} borderRadius={4} style={styles.contentLine} />
      </View>
    </View>
  );
}

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
  detailContainer: {
    gap: spacing.md,
  },
  detailHeader: {
    borderCurve: "continuous",
    gap: spacing.sm,
  },
  detailMeta: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metaBadge: {
    marginRight: spacing.xs,
  },
  detailSection: {
    borderCurve: "continuous",
    gap: spacing.xs,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  contentLine: {
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
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
