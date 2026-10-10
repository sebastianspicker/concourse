import { withOpacity } from "./theme";
import type { useTheme } from "./ThemeProvider";

/** Rows sit directly on the hall; interaction tints them with a faint ink wash, never a color fill. */
export function getResourceRowBackground(
  theme: ReturnType<typeof useTheme>,
  pressed: boolean,
  hovered: boolean,
): string {
  if (pressed) return withOpacity(theme.colors.text, 0.08);
  if (hovered) return withOpacity(theme.colors.text, 0.04);
  return "transparent";
}
