/** Shared actions: solid black primary, outlined secondary, and an error-ink destructive variant, all in the heavy action voice. */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { forwardRef, type ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "./theme";
import { useTheme, useDesignMetrics } from "./ThemeProvider";

export type ButtonVariant = "primary" | "secondary" | "destructive";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

export type ButtonProps = Omit<ComponentProps<typeof Pressable>, "children" | "style"> & {
  label: string;
  variant?: ButtonVariant;
  icon?: IconName;
  /** Places the icon after the label, as for outbound links. */
  trailingIcon?: boolean;
  /** Stretches to the container width (phone action stacks). */
  block?: boolean;
};

function useButtonColors(variant: ButtonVariant): { fill: string; ink: string; outline: string } {
  const { colors } = useTheme();
  if (variant === "primary") return { fill: colors.text, ink: colors.background, outline: colors.text };
  if (variant === "destructive") return { fill: "transparent", ink: colors.error, outline: colors.error };
  return { fill: "transparent", ink: colors.text, outline: colors.text };
}

export const Button = forwardRef<View, ButtonProps>(function Button(
  { label, variant = "secondary", icon, trailingIcon = false, block = false, accessibilityRole = "button", ...pressableProps },
  ref,
) {
  const metrics = useDesignMetrics();
  const { fill, ink, outline } = useButtonColors(variant);
  const glyph = icon ? <MaterialIcons name={icon} size={18} color={ink} /> : null;

  return (
    <Pressable
      ref={ref}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={pressableProps.accessibilityLabel ?? label}
      {...pressableProps}
      // One flat style object: Link asChild forwards it to the anchor as-is (no functions, no arrays).
      style={StyleSheet.flatten([
        styles.button,
        block && styles.block,
        {
          backgroundColor: fill,
          borderColor: outline,
          borderWidth: 1.5,
          borderRadius: metrics.controlRadius,
        },
      ])}
    >
      {({ pressed }) => (
        <View style={[styles.content, pressed && styles.pressed]}>
          {trailingIcon ? null : glyph}
          <Text numberOfLines={2} style={[styles.label, { color: ink }]}>{label}</Text>
          {trailingIcon ? glyph : null}
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    alignSelf: "flex-start",
  },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  block: { alignSelf: "stretch" },
  label: { ...typography.action, flexShrink: 1, textAlign: "center" },
  pressed: { opacity: 0.72 },
});
