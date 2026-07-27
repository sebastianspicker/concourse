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
  const ui = theme.ui;

  const captionSize = scaledFont(typography.caption.fontSize, ui);
  const captionLineHeight = scaledFont(typography.caption.lineHeight, ui);
  const bodySize = scaledFont(typography.body.fontSize, ui);
  const bodyLineHeight = scaledFont(typography.body.lineHeight, ui);

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: theme.colors.border,
          borderBottomWidth: ui.borderWidth,
          paddingVertical: scaled(spacing.md, ui),
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
