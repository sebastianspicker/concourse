/** Resolves system and user theme choices, then applies institution accent safely. */
import { getContrastRatio, type InstitutionDesignPreset } from "@concourse/shared";
import {
  colorSchemes,
  getContrastTextColor,
  uiSchemes,
  type ColorScheme
} from "./theme";
import { DEFAULT_DESIGN_PRESET, getDesignPreset } from "./designPresets";
import type { Theme, ThemePreference } from "./themeTypes";

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

/** Uses an institution accent only when it meets surface contrast requirements. */
export function applyInstitutionAccent(theme: Theme, institutionAccent?: string): Theme {
  if (!institutionAccent || theme.colorScheme === "highContrast") return theme;

  const resolvedAccent = getContrastRatio(institutionAccent, theme.colors.surface) >= 4.5
    ? institutionAccent
    : theme.colors.accent;

  return {
    ...theme,
    colors: {
      ...theme.colors,
      accent: resolvedAccent,
      accentText: getContrastTextColor(resolvedAccent),
    },
  };
}

/** Builds the initial light theme before system preference hydration completes. */
export function getInitialTheme(designPresetId?: InstitutionDesignPreset): Theme {
  return getThemeForScheme(DEFAULT_COLOR_SCHEME, designPresetId);
}
