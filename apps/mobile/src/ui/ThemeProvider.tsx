/** Resolves persisted preference, system scheme, and institution accent into tree-wide theme state. */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { ThemeContext } from "./themeContextValue";
import {
  DEFAULT_THEME_PREFERENCE,
  type ThemeContextValue,
  type ThemePreference,
} from "./themeTypes";
import { applyInstitutionAccent, getThemeForScheme, resolveColorScheme } from "./themeResolve";
import { loadThemePreference, saveThemePreference } from "./themePreferenceStorage";
import { getConfiguredInstitution } from "../config/institution";

/** Hydrates persisted appearance preferences and publishes the resolved theme context. */
export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
  const resolvedScheme = resolveColorScheme(preference, systemColorScheme);
  const institution = getConfiguredInstitution();
  const designPreset = institution.app?.designPreset;
  const institutionAccent = institution.app?.accent;
  const theme = useMemo(() => {
    const baseTheme = getThemeForScheme(resolvedScheme, designPreset);
    return applyInstitutionAccent(baseTheme, institutionAccent);
  }, [designPreset, institutionAccent, resolvedScheme]);

  useEffect(() => {
    loadThemePreference()
      .then((saved) => {
        if (saved) setPreferenceState(saved);
      })
      .catch((error: unknown) => {
        if (__DEV__) console.warn("Failed to load theme preference:", error);
      });
  }, []);

  const setPreference = useCallback(async (newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    try {
      await saveThemePreference(newPreference);
    } catch (error: unknown) {
      if (__DEV__) console.warn("Failed to save theme preference:", error);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newPreference: ThemePreference = resolvedScheme === "dark" ? "light" : "dark";
    void setPreference(newPreference);
  }, [resolvedScheme, setPreference]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    preference,
    setPreference,
    toggleTheme,
  }), [preference, setPreference, theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
