import { StyleSheet } from "react-native";
import { spacing, typography } from "@/design-system/theme";

export const styles = StyleSheet.create({
  signalBoard: {
    minHeight: 164,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  signalBoardWide: {
    flex: 1,
    flexDirection: "row",
    minHeight: 168,
  },
  nowPanel: {
    minHeight: 150,
    padding: spacing.xl,
    justifyContent: "space-between",
    gap: spacing.md,
  },
  nextPanel: {
    minHeight: 150,
    padding: spacing.xl,
    justifyContent: "space-between",
    gap: spacing.md,
  },
  panelWide: {
    flex: 1,
    minHeight: 168,
  },
  panelBody: {
    gap: spacing.xs,
  },
  signalLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    opacity: 0.85,
  },
  signalTitle: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.6,
    fontWeight: "600",
  },
  signalMeta: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.88,
  },
  nextMeta: {
    opacity: 0.72,
  },
});
