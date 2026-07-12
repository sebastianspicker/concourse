import React, { useEffect, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { ThemeContext } from "./themeContextValue";
import {
  DEFAULT_THEME_PREFERENCE,
  type ThemeContextValue,
  type ThemePreference,
} from "./themeTypes";
import { getInitialTheme, getThemeForScheme, resolveColorScheme } from "./themeResolve";
import { loadThemePreference, saveThemePreference } from "./themePreferenceStorage";
import { getConfiguredInstitution } from "../config/institution";
import { getContrastTextColor } from "./theme";

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
  const [isLoaded, setIsLoaded] = useState(false);
  const resolvedScheme = resolveColorScheme(preference, systemColorScheme);
  const baseTheme = getThemeForScheme(resolvedScheme);
  const institutionAccent = getConfiguredInstitution().app?.accent;
  const theme = resolvedScheme !== "highContrast" && institutionAccent
    ? {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          accent: institutionAccent,
          accentText: getContrastTextColor(institutionAccent),
        },
      }
    : baseTheme;

  useEffect(() => {
    loadThemePreference()
      .then((saved) => {
        if (saved) setPreferenceState(saved);
      })
      .catch((error: unknown) => {
        if (__DEV__) console.warn("Failed to load theme preference:", error);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  const setPreference = async (newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    try {
      await saveThemePreference(newPreference);
    } catch (error: unknown) {
      if (__DEV__) console.warn("Failed to save theme preference:", error);
    }
  };

  const toggleTheme = () => {
    const newPreference: ThemePreference = resolvedScheme === "dark" ? "light" : "dark";
    void setPreference(newPreference);
  };

  const value: ThemeContextValue = {
    theme: isLoaded ? theme : getInitialTheme(),
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
