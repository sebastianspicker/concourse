import { StyleSheet } from "react-native";
import { spacing, typography } from "@/design-system/theme";

export const styles = StyleSheet.create({
  agenda: { marginTop: spacing.xl },
  agendaWide: { gap: spacing.huge, marginTop: spacing.huge },
  scheduleColumn: { minWidth: 0 },
  scheduleColumnWide: {},
  eventsColumn: { minWidth: 0 },
  eventsColumnWide: {},
  notices: { gap: spacing.sm },
  limitNotice: { ...typography.small, paddingTop: spacing.sm },
});
