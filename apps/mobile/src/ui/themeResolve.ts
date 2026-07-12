import { ColorScheme, colorSchemes, lightColors, uiSchemes } from "./theme";
import type { Theme, ThemePreference } from "./themeTypes";

const DEFAULT_COLOR_SCHEME: ColorScheme = "light";

export function resolveColorScheme(
  preference: ThemePreference,
  systemColorScheme: "light" | "dark" | "unspecified" | null | undefined
): ColorScheme {
  if (preference !== "system") {
    return preference;
  }

  return systemColorScheme === "light" ? "light" : DEFAULT_COLOR_SCHEME;
}

export function getThemeForScheme(colorScheme: ColorScheme): Theme {
  return {
    colors: colorSchemes[colorScheme],
    ui: uiSchemes[colorScheme],
    isDark: colorScheme !== "light",
    colorScheme,
  };
}

export function getInitialTheme(): Theme {
  return {
    colors: lightColors,
    ui: uiSchemes.dark,
    isDark: false,
    colorScheme: DEFAULT_COLOR_SCHEME,
  };
}
