import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getInstitutionLocale } from "../config/institution";
import { de, en, type TranslationKey } from "./dictionaries";

export type LanguagePreference = "institution" | "en" | "de";
type Locale = "en" | "de";

type LocaleContextValue = {
  locale: Locale;
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => Promise<void>;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const STORAGE_KEY = "campus-app-kit:language-preference";
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

export function LocaleProvider({ children }: { children: ReactNode }): JSX.Element {
  const [preference, setPreferenceState] = useState<LanguagePreference>("institution");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "institution" || saved === "en" || saved === "de") {
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
        await AsyncStorage.setItem(STORAGE_KEY, next);
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

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
