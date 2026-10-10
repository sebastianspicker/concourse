/** The round arrow that marks a card or block as a way in. Decorative: the surrounding link is the control. */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, View } from "react-native";

export function ArrowCircle({ color, size = 52 }: { color: string; size?: number }): JSX.Element {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}
    >
      <MaterialIcons name="arrow-forward" size={Math.round(size * 0.46)} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
});
