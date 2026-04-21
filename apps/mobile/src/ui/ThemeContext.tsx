import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeColors, ThemeUi, ColorScheme, colorSchemes, uiSchemes, darkColors, getThemeColors, getThemeUi } from "./theme";

// ============================================
// Theme Types
// ============================================

export type ThemePreference = "light" | "dark" | "accessibility" | "system";
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "dark";
export const DEFAULT_COLOR_SCHEME: ColorScheme = "dark";

export type Theme = {
  colors: ThemeColors;
  ui: ThemeUi;
  isDark: boolean;
  colorScheme: ColorScheme;
};

// ============================================
// Theme Context
// ============================================

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "@campus-app/theme-preference";

// ============================================
// Theme Provider
// ============================================

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
      AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved && ["light", "dark", "accessibility", "system"].includes(saved)) {
          setPreferenceState(saved as ThemePreference);
        }
      })
      .catch((error: unknown) => {
        if (__DEV__) console.warn("Failed to load theme preference:", error);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  // Resolve the actual color scheme based on preference
  const resolvedScheme: ColorScheme =
    preference === "system"
      ? (systemColorScheme === "light" ? "light" : DEFAULT_COLOR_SCHEME)
      : preference;

  const theme: Theme = {
    colors: colorSchemes[resolvedScheme],
    ui: uiSchemes[resolvedScheme],
    isDark: resolvedScheme !== "light",
    colorScheme: resolvedScheme,
  };

  const setPreference = async (newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newPreference);
    } catch (error: unknown) {
      if (__DEV__) console.warn("Failed to save theme preference:", error);
    }
  };

  const toggleTheme = () => {
    // Toggle between light and dark (not system)
    const newPreference: ThemePreference = resolvedScheme === "dark" ? "light" : "dark";
    void setPreference(newPreference);
  };

  // Provide default theme during initial load
  const value: ThemeContextValue = {
    theme: isLoaded ? theme : {
      colors: darkColors,
      ui: uiSchemes.dark,
      isDark: true,
      colorScheme: DEFAULT_COLOR_SCHEME,
    },
    preference,
    setPreference,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================
// Theme Hooks
// ============================================

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

/** Returns theme for the system color scheme, ignoring the user's app-level preference. */
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
