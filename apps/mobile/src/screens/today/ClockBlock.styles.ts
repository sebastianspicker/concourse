import { StyleSheet } from "react-native";
import { spacing, typography } from "@/ui/theme";

export const styles = StyleSheet.create({
  clockBlock: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.lg,
    minHeight: 100,
    justifyContent: "flex-end",
  },
  clockBlockWide: {
    width: 330,
    minHeight: 168,
    borderBottomWidth: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingRight: spacing.xxl,
    paddingBottom: spacing.sm,
    justifyContent: "flex-end",
  },
  date: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    letterSpacing: -0.15,
    marginBottom: spacing.sm,
  },
  clockMeta: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  clockMetaLabel: {
    ...typography.caption,
    fontWeight: "500",
  },
  tzChip: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tzChipText: {
    ...typography.small,
    fontWeight: "500",
  },
  freshnessRow: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  freshnessChip: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
  },
  freshnessDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  freshnessLabel: {
    ...typography.caption,
    fontWeight: "500",
  },
});
