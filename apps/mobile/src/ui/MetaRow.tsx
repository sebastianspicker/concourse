/** Renders labeled detail metadata with predictable visual and spoken grouping. */
import { StyleSheet, Text, View } from "react-native";
import { scaled, scaledFont, spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    fontWeight: "700",
    letterSpacing: 0.75,
    textTransform: "uppercase",
    flexBasis: 104,
    flexGrow: 0,
  },
  value: {
    ...typography.body,
    flex: 1,
    flexBasis: 160,
    textAlign: "left",
  },
});

/** Aligns a detail label and value while preserving selectable source text. */
export function MetaRow({
  label,
  value
}: {
  label: string;
  value: string;
}): JSX.Element {
  const theme = useTheme();

  const captionSize = scaledFont(typography.caption.fontSize, theme.ui);
  const captionLineHeight = scaledFont(typography.caption.lineHeight, theme.ui);
  const bodySize = scaledFont(typography.body.fontSize, theme.ui);
  const bodyLineHeight = scaledFont(typography.body.lineHeight, theme.ui);

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: theme.colors.border,
          borderBottomWidth: theme.ui.borderWidth,
          paddingVertical: scaled(spacing.md, theme.ui),
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.muted,
            fontSize: captionSize,
            lineHeight: captionLineHeight,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        selectable
        style={[
          styles.value,
          {
            color: theme.colors.text,
            fontSize: bodySize,
            lineHeight: bodyLineHeight,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
