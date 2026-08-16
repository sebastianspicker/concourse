/** Owns loading-region accessibility semantics shared by visual skeleton variants. */
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

type SkeletonLoadingRegionProps = {
  accessibilityLabel: string;
  announceLoading?: boolean;
  children: ReactNode;
  style: StyleProp<ViewStyle>;
};

/** Renders either one busy status or an inaccessible decorative loading region. */
export function SkeletonLoadingRegion({
  accessibilityLabel,
  announceLoading = true,
  children,
  style,
}: SkeletonLoadingRegionProps): JSX.Element {
  if (announceLoading) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        style={style}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={style}
    >
      {children}
    </View>
  );
}
