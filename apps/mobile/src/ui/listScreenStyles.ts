import { StyleSheet } from "react-native";
import { ThemeColors, typography } from "./theme";

type ListScreenStyles = {
  muted: {
    color: string;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
  };
};

export function createListScreenStyles(themeColors: ThemeColors): ListScreenStyles {
  return StyleSheet.create({
    muted: {
      ...typography.body,
      color: themeColors.muted,
    },
  });
}
