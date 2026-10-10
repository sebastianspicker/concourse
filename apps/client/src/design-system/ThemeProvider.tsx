/** Resolves persisted preference, system scheme, and institution accent into tree-wide theme state. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import type { Theme, ThemePreference } from "./theme";
import { getDesignPreset, type DesignMetrics } from "./designPresets";
import { applyInstitutionAccent, getThemeForScheme, resolveColorScheme } from "./themeResolve";
import { loadThemePreference, saveThemePreference } from "./themePreferenceStorage";
import { getConfiguredInstitution } from "@/platform/env/institution";
import { useHydrated } from "./useHydratedWindowWidth";

export type { Theme, ThemePreference };
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Hydrates persisted appearance preferences and publishes the resolved theme context. */
export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const systemColorScheme = useColorScheme();
  // Static HTML is rendered without a device scheme; adopting it only after hydration lets React
  // re-render every style instead of leaving server (light) styles on a dark client.
  const hydrated = useHydrated();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
  const resolvedScheme = resolveColorScheme(preference, hydrated ? systemColorScheme : null);
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

/** Returns the resolved theme and rejects use outside ThemeProvider. */
export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context.theme;
}

/** Returns persisted theme controls and rejects use outside ThemeProvider. */
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

/** Returns the layout metrics of the active institution design preset. */
export function useDesignMetrics(): DesignMetrics {
  return getDesignPreset(useTheme().designPreset).metrics;
}
