import { StyleSheet } from "react-native";
import { spacing } from "@/design-system/theme";

export const styles = StyleSheet.create({
  agenda: { gap: spacing.xxl },
  agendaWide: { flexDirection: "row", gap: 0 },
  agendaColumn: { flex: 1, minWidth: 0 },
  scheduleColumn: { paddingRight: spacing.xxl, borderRightWidth: StyleSheet.hairlineWidth },
  eventsColumn: { paddingLeft: spacing.xxl },
});
