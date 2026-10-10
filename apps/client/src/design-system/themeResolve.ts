/** Resolves system and user theme choices, then applies institution accent safely. */
import { getContrastRatio, type InstitutionDesignPreset } from "@concourse/institutions";
import {
  colorSchemes,
  getContrastTextColor,
  uiSchemes,
  type ColorScheme,
  type Theme,
  type ThemePreference,
} from "./theme";
import { DEFAULT_DESIGN_PRESET, getDesignPreset } from "./designPresets";

const DEFAULT_COLOR_SCHEME: ColorScheme = "light";

/** Honors an explicit preference, otherwise selects dark only for a dark system scheme. */
export function resolveColorScheme(
  preference: ThemePreference,
  systemColorScheme: "light" | "dark" | "unspecified" | null | undefined
): ColorScheme {
  if (preference !== "system") {
    return preference;
  }

  if (systemColorScheme === "dark") return "dark";
  return DEFAULT_COLOR_SCHEME;
}

/** Merges the selected color scheme with institution palette and metric overrides. */
export function getThemeForScheme(
  colorScheme: ColorScheme,
  designPresetId?: InstitutionDesignPreset
): Theme {
  const designPreset = getDesignPreset(designPresetId);
  const palette = colorScheme === "light" ? designPreset.light : designPreset.dark;
  const baseUi = uiSchemes[colorScheme];

  return {
    colors: colorScheme === "highContrast"
      ? colorSchemes.highContrast
      : { ...colorSchemes[colorScheme], ...palette },
    ui: colorScheme === "highContrast"
      ? baseUi
      : { ...baseUi, ...designPreset.ui },
    isDark: colorScheme !== "light",
    colorScheme,
    designPreset: colorScheme === "highContrast" ? DEFAULT_DESIGN_PRESET : designPreset.id,
  };
}

const READABLE_TEXT = 4.5;

/** Mixes a hex color toward a target (0 keeps the color, 1 reaches the target). */
function mix(color: string, target: string, amount: number): string {
  const channel = (hex: string, start: number): number => Number.parseInt(hex.slice(start, start + 2), 16);
  return `#${[1, 3, 5]
    .map((start) => Math.round(channel(color, start) + (channel(target, start) - channel(color, start)) * amount))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

/**
 * Returns the institution color itself when it reads as text on every given canvas, otherwise
 * the nearest tint (toward white on dark canvases, toward black on light ones) that does.
 */
export function readableTint(color: string, canvases: string[], dark: boolean): string | undefined {
  const target = dark ? "#FFFFFF" : "#000000";
  for (let step = 0; step <= 20; step += 1) {
    const candidate = step === 0 ? color.toUpperCase() : mix(color, target, step / 20);
    if (canvases.every((canvas) => getContrastRatio(candidate, canvas) >= READABLE_TEXT)) return candidate;
  }
  return undefined;
}

/** Keeps the institution color as the fill (`brand`) and a readable tint of it for text (`accent`). */
export function applyInstitutionAccent(theme: Theme, institutionAccent?: string): Theme {
  if (!institutionAccent || theme.colorScheme === "highContrast") return theme;

  const { background, surface } = theme.colors;
  const resolvedAccent = readableTint(institutionAccent, [background, surface], theme.isDark) ?? theme.colors.accent;
  const brandText = getContrastTextColor(institutionAccent);
  const hasReadableBand = getContrastRatio(institutionAccent, brandText) >= READABLE_TEXT;

  return {
    ...theme,
    colors: {
      ...theme.colors,
      brand: hasReadableBand ? institutionAccent : theme.colors.brand,
      brandText: hasReadableBand ? brandText : theme.colors.brandText,
      accent: resolvedAccent,
      accentText: getContrastTextColor(resolvedAccent),
    },
  };
}
