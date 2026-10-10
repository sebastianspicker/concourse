import { StyleSheet } from "react-native";
import { spacing, typography } from "@/design-system/theme";

export const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", columnGap: spacing.xl, rowGap: spacing.sm },
  date: { ...typography.heading },
  dateCompact: { fontSize: 30, lineHeight: 36 },
  time: { alignItems: "flex-end" },
  clock: { ...typography.clock },
  clockCompact: { fontSize: 40, lineHeight: 42 },
  metaText: { ...typography.caption },
});
