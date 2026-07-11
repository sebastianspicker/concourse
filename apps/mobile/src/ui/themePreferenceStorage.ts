import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemePreference } from "./themeTypes";

export const THEME_PREFERENCE_STORAGE_NAME = "@campus-app/theme-preference";

const THEME_PREFERENCES: readonly ThemePreference[] = [
  "light",
  "dark",
  "accessibility",
  "system",
];

export function isThemePreference(value: string | null): value is ThemePreference {
  return value !== null && THEME_PREFERENCES.includes(value as ThemePreference);
}

export async function loadThemePreference(): Promise<ThemePreference | null> {
  const saved = await AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_NAME);
  return isThemePreference(saved) ? saved : null;
}

export function saveThemePreference(preference: ThemePreference): Promise<void> {
  return AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_NAME, preference);
}
