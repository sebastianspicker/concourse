import { StyleSheet } from "react-native";
import { spacing } from "@/ui/theme";

export const styles = StyleSheet.create({
  signalStage: { gap: spacing.lg },
  signalStageWide: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.xl,
  },
});
