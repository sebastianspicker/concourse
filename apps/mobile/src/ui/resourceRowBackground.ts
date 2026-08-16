import { withOpacity } from "./theme";
import type { useTheme } from "./ThemeContext";

/** Resolves the quiet active and tactile pressed surface colors for a resource ticket. */
export function getResourceRowBackground(
  theme: ReturnType<typeof useTheme>,
  pressed: boolean,
  active: boolean,
  open: boolean,
  timeline: boolean,
): string {
  if (pressed) {
    if (timeline && active) return withOpacity(theme.colors.signal, 0.28);
    return withOpacity(theme.colors.accent, 0.10);
  }
  // Timeline “next” wash outranks open transparent so the active spine stays legible.
  if (timeline && active) return withOpacity(theme.colors.signal, 0.18);
  if (open) return "transparent";
  if (active) return withOpacity(theme.colors.accent, 0.07);
  return theme.colors.surface;
}
