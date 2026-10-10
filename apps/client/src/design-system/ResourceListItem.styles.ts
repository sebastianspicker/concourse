import { StyleSheet } from "react-native";
import { BOARD_TIME_COLUMN, fonts, spacing, typography } from "./theme";

export const styles = StyleSheet.create({
  link: { width: "100%" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
    paddingVertical: spacing.lg + 2,
  },
  leading: { width: BOARD_TIME_COLUMN, paddingTop: 1 },
  leadingTime: { ...typography.dataStrong },
  leadingDetail: { ...typography.dataSmall },
  dayWeekday: { ...typography.caption },
  dayNumber: { fontFamily: fonts.display, fontSize: 30, lineHeight: 32, fontVariant: ["lining-nums", "tabular-nums"] },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { ...typography.rowTitle },
  titleHovered: { textDecorationLine: "underline" },
  subtitle: { ...typography.caption },
  subtitleData: { ...typography.dataSmall },
  aside: { ...typography.caption, textAlign: "right", maxWidth: 200, paddingTop: 2 },
  asideFolded: { ...typography.caption },
  status: { alignSelf: "flex-start", paddingTop: 1 },
  tag: { ...typography.action, fontSize: 12, lineHeight: 16, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1.5, overflow: "hidden" },
  card: { minHeight: 300, borderWidth: 1, padding: spacing.xl, justifyContent: "space-between", gap: spacing.xl },
  cardHead: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  cardMeta: { ...typography.label },
  cardBody: { gap: spacing.sm },
  cardTitle: { ...typography.cardTitle },
});
