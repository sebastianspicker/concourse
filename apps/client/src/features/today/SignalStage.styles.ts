import { StyleSheet } from "react-native";
import { spacing, typography } from "@/design-system/theme";

export const styles = StyleSheet.create({
  stage: { gap: spacing.xl },
  stageWide: { gap: spacing.xxl },
  board: { gap: spacing.lg },
  boardWide: { flexDirection: "row", alignItems: "stretch" },
  slot: { minHeight: 260 },
  nowWide: { flex: 2, minHeight: 400 },
  nextWide: { flex: 1, minHeight: 400 },
  fill: { flex: 1 },
  slotPressed: { opacity: 0.85 },
  slotCopy: { flex: 1, padding: spacing.xl, gap: spacing.lg, justifyContent: "space-between" },
  slotMain: { gap: spacing.sm },
  slotLabel: { ...typography.action },
  leadTitle: { ...typography.hero },
  leadTitleCompact: { fontSize: 38, lineHeight: 40 },
  nextTitle: { ...typography.cardTitle },
  slotMeta: { ...typography.body },
  slotNote: { ...typography.caption, maxWidth: 520 },
  hovered: { textDecorationLine: "underline" },
});
