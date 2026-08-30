/** Reads theme context and fails loudly when a consumer is outside its provider. */
import { useContext } from "react";
import { ThemeContext } from "./themeContextValue";
import { type Theme, type ThemePreference } from "./themeTypes";

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
