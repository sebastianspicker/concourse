import React from "react";
import { StyleSheet, View } from "react-native";
import { scaled, scaledRadius, spacing } from "./theme";
import { useTheme } from "./ThemeContext";
import { Skeleton } from "./SkeletonPrimitive";

const styles = StyleSheet.create({
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
  iconLabel: {
    marginLeft: spacing.xs,
  },
});

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
      <View style={[styles.detailHeader, sectionStyle]}>
        <Skeleton width="70%" height={28} borderRadius={6} />
        <View style={styles.detailMeta}>
          <Skeleton width={100} height={20} borderRadius={10} style={styles.metaBadge} />
          <Skeleton width={80} height={20} borderRadius={10} style={styles.metaBadge} />
        </View>
      </View>
      <View style={[styles.detailSection, sectionStyle]}>
        <Skeleton width="40%" height={16} borderRadius={4} style={styles.sectionTitle} />
        <Skeleton width="100%" height={14} borderRadius={4} />
        <Skeleton width="90%" height={14} borderRadius={4} style={styles.contentLine} />
        <Skeleton width="95%" height={14} borderRadius={4} style={styles.contentLine} />
      </View>
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
