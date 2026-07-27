/** Implements the non-animated, accessible primitive behind loading placeholders. */
import { View, type DimensionValue, type ViewStyle } from "react-native";
import { scaled, scaledRadius } from "./theme";
import { useTheme } from "./ThemeContext";

export type SkeletonProps = { width?: DimensionValue; height?: number; borderRadius?: number; style?: ViewStyle };

/** Draws a neutral loading block that stays hidden from assistive technologies. */
export function Skeleton({ width = 300, height = 16, borderRadius = 4, style }: SkeletonProps): JSX.Element {
  const theme = useTheme();
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height: Math.max(2, scaled(height, theme.ui)),
          borderRadius: scaledRadius(borderRadius, theme.ui),
          opacity: 0.28,
          backgroundColor: theme.colors.muted,
        },
        style,
      ]}
    />
  );
}
