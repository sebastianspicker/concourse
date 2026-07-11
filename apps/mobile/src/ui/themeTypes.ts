import type { ColorScheme, ThemeColors, ThemeUi } from "./theme";

export type ThemePreference = "light" | "dark" | "accessibility" | "system";
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "dark";
export const DEFAULT_COLOR_SCHEME: ColorScheme = "dark";

export type Theme = {
  colors: ThemeColors;
  ui: ThemeUi;
  isDark: boolean;
  colorScheme: ColorScheme;
};

export type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => void;
};
