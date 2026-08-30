import type { ColorScheme, ThemeColors, ThemeUi } from "./theme";
import type { InstitutionDesignPreset } from "@concourse/institutions";

export type ThemePreference = "light" | "dark" | "highContrast" | "system";
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";
export const DEFAULT_COLOR_SCHEME: ColorScheme = "light";

export type Theme = {
  colors: ThemeColors;
  ui: ThemeUi;
  isDark: boolean;
  colorScheme: ColorScheme;
  designPreset: InstitutionDesignPreset;
};

export type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => void;
};
