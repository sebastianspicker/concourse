import { View } from "react-native";
import { styles } from "./ResourceListItem.styles";
import { withOpacity } from "./theme";
import type { useTheme } from "./ThemeContext";

export function TimelineSpineDot({
  active,
  theme,
}: {
  active: boolean;
  theme: ReturnType<typeof useTheme>;
}): JSX.Element {
  const wash = withOpacity(theme.colors.signal, 0.18);
  return (
    <View
      testID="resource-spine-dot"
      style={styles.spineSlot}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.spineRing, active ? { backgroundColor: wash } : null]}>
        <View
          style={[
            styles.spineDot,
            active
              ? { backgroundColor: theme.colors.signal, borderColor: theme.colors.signal }
              : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        />
      </View>
    </View>
  );
}
