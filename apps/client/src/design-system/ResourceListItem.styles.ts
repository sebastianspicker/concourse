import { StyleSheet } from "react-native";
import { spacing, typography } from "./theme";

const SPINE_DOT_SIZE = 11;
const SPINE_RING_PAD = 4;

export const styles = StyleSheet.create({
  link: { width: "100%" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowDivider: { borderBottomWidth: 1 },
  copy: { flex: 1, minWidth: 0 },
  title: { ...typography.body, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { ...typography.caption, marginTop: 3 },
  badge: {
    ...typography.small,
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  timelineTimeColumn: {
    width: 72,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  timelineTime: {
    ...typography.caption,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  spineSlot: {
    width: SPINE_DOT_SIZE + SPINE_RING_PAD * 2,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  spineRing: {
    padding: SPINE_RING_PAD,
    borderRadius: 9999,
  },
  spineDot: {
    width: SPINE_DOT_SIZE,
    height: SPINE_DOT_SIZE,
    borderRadius: SPINE_DOT_SIZE / 2,
    borderWidth: 2,
  },
});
