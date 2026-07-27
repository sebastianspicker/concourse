/** Provides persisted language preference and localized message lookup to the component tree. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getInstitutionLocale } from "../config/institution";
import { readAndMigrateLegacyValue } from "../storage/readAndMigrateLegacyValue";
import { de, en, type TranslationKey } from "./dictionaries";

export type LanguagePreference = "institution" | "en" | "de";
type Locale = "en" | "de";

type LocaleContextValue = {
  locale: Locale;
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => Promise<void>;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

export const LANGUAGE_PREFERENCE_STORAGE_ID = "concourse:language-preference";
const LEGACY_LANGUAGE_PREFERENCE_STORAGE_ID = "campus-app-kit:language-preference";
const LANGUAGE_PREFERENCES = new Set<LanguagePreference>(["institution", "en", "de"]);
const defaultContext: LocaleContextValue = {
  locale: "en",
  preference: "institution",
  setPreference: async () => undefined,
  t: (key, values) => Object.entries(values ?? {}).reduce<string>(
    (message, [name, replacement]) => message.replace(`{${name}}`, String(replacement)),
    en[key]
  ),
};
const LocaleContext = createContext<LocaleContextValue>(defaultContext);

function resolveLocale(preference: LanguagePreference): Locale {
  return preference === "institution" ? getInstitutionLocale() : preference;
}

function isLanguagePreference(value: string | null): value is LanguagePreference {
  return LANGUAGE_PREFERENCES.has(value as LanguagePreference);
}

/** Persists the language preference and supplies localized strings to the component tree. */
export function LocaleProvider({ children }: { children: ReactNode }): JSX.Element {
  const [preference, setPreferenceState] = useState<LanguagePreference>("institution");

  useEffect(() => {
    readAndMigrateLegacyValue(
      AsyncStorage,
      LANGUAGE_PREFERENCE_STORAGE_ID,
      LEGACY_LANGUAGE_PREFERENCE_STORAGE_ID,
    )
      .then((saved) => {
        if (isLanguagePreference(saved)) {
          setPreferenceState(saved);
        }
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const locale = resolveLocale(preference);
    const dictionary = locale === "de" ? de : en;
    return {
      locale,
      preference,
      setPreference: async (next) => {
        setPreferenceState(next);
        await AsyncStorage.setItem(LANGUAGE_PREFERENCE_STORAGE_ID, next);
      },
      t: (key, values) => {
        const template = dictionary[key];
        return Object.entries(values ?? {}).reduce<string>(
          (message, [name, replacement]) => message.replace(`{${name}}`, String(replacement)),
          template
        );
      },
    };
  }, [preference]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Returns the current translation function and persisted language preference controls. */
export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
