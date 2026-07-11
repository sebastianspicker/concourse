import { useContext } from "react";
import { useColorScheme } from "react-native";
import { ColorScheme, getThemeColors, getThemeUi, type ThemeColors, type ThemeUi } from "./theme";
import { ThemeContext } from "./themeContextValue";
import { DEFAULT_COLOR_SCHEME, type Theme, type ThemePreference } from "./themeTypes";

export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context.theme;
}

export function useThemePreference(): {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => void;
} {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemePreference must be used within a ThemeProvider");
  }
  return {
    preference: context.preference,
    setPreference: context.setPreference,
    toggleTheme: context.toggleTheme,
  };
}

export function useThemeColors(): ThemeColors {
  const theme = useTheme();
  return theme.colors;
}

export function useThemeUi(): ThemeUi {
  const theme = useTheme();
  return theme.ui;
}

export function useIsDarkMode(): boolean {
  const theme = useTheme();
  return theme.isDark;
}

export function useSystemTheme(): Theme {
  const systemColorScheme = useColorScheme();
  const colorScheme: ColorScheme =
    systemColorScheme === "light" ? "light" : DEFAULT_COLOR_SCHEME;

  return {
    colors: getThemeColors(colorScheme),
    ui: getThemeUi(colorScheme),
    isDark: colorScheme !== "light",
    colorScheme,
  };
}
