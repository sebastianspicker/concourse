import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeContext";

export function SignalPageHeader({ title }: { title: string }): JSX.Element {
  const theme = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 100, justifyContent: "flex-end", paddingBottom: spacing.xl, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { ...typography.heading },
});
