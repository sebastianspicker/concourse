/** Validates and persists the user’s selected color-scheme preference. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { readAndMigrateLegacyValue } from "@/platform/storage/readAndMigrateLegacyValue";
import type { ThemePreference } from "./themeTypes";

export const THEME_PREFERENCE_STORAGE_NAME = "@concourse/theme-preference";
const LEGACY_THEME_PREFERENCE_STORAGE_NAME = "@campus-app/theme-preference";

const THEME_PREFERENCES: readonly ThemePreference[] = [
  "light",
  "dark",
  "highContrast",
  "system",
];

/** Narrows stored strings to the supported persisted appearance preferences. */
export function isThemePreference(value: string | null): value is ThemePreference {
  return value !== null && THEME_PREFERENCES.includes(value as ThemePreference);
}

/** Reads a saved preference and migrates the legacy accessibility value to high contrast. */
export async function loadThemePreference(): Promise<ThemePreference | null> {
  const saved = await readAndMigrateLegacyValue(
    AsyncStorage,
    THEME_PREFERENCE_STORAGE_NAME,
    LEGACY_THEME_PREFERENCE_STORAGE_NAME,
    (value) => value === "accessibility" ? "highContrast" : value,
  );
  if (saved === "accessibility") return "highContrast";
  return isThemePreference(saved) ? saved : null;
}

/** Stores the user’s resolved preference for the next application launch. */
export function saveThemePreference(preference: ThemePreference): Promise<void> {
  return AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_NAME, preference);
}
