import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { clearPersistedCache } from "@/data/persistedCache";
import { clearCache } from "@/data/cache";
import { getInstitutionDisplayName } from "@/config/institution";
import { useLocale, type LanguagePreference } from "@/i18n/LocaleContext";
import { Screen } from "@/ui/Screen";
import { ChoiceRow, SettingsGroup } from "@/ui/SettingsGroup";
import { useTheme, useThemePreference, type ThemePreference } from "@/ui/ThemeContext";
import { spacing, typography } from "@/ui/theme";

export default function SettingsScreen(): JSX.Element {
  const theme = useTheme();
  const { preference: themePreference, setPreference: setThemePreference } = useThemePreference();
  const { preference: languagePreference, setPreference: setLanguagePreference, t } = useLocale();
  const [status, setStatus] = useState<string | null>(null);

  const themeChoices: Array<{ value: ThemePreference; label: string }> = [
    { value: "system", label: t("systemTheme") },
    { value: "light", label: t("lightTheme") },
    { value: "dark", label: t("darkTheme") },
    { value: "highContrast", label: t("highContrastTheme") },
  ];
  const languageChoices: Array<{ value: LanguagePreference; label: string }> = [
    { value: "institution", label: t("institutionLanguage") },
    { value: "en", label: "English" },
    { value: "de", label: "Deutsch" },
  ];

  const confirmClear = () => {
    Alert.alert(t("clearConfirmTitle"), t("clearConfirmBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("clear"),
        style: "destructive",
        onPress: () => {
          clearCache();
          clearPersistedCache()
            .then(() => setStatus(t("cleared")))
            .catch(() => setStatus(t("errorUnknown")));
        },
      },
    ]);
  };

  return (
    <Screen maxWidth={640} testID="settings-screen">
      <SettingsGroup title={t("appearance")}>
        <View accessibilityRole="radiogroup">
          {themeChoices.map((choice) => (
            <ChoiceRow
              key={choice.value}
              label={choice.label}
              selected={themePreference === choice.value}
              onPress={() => void setThemePreference(choice.value)}
              testID={`theme-${choice.value}`}
            />
          ))}
        </View>
      </SettingsGroup>
      <SettingsGroup title={t("language")}>
        <View accessibilityRole="radiogroup">
          {languageChoices.map((choice) => (
            <ChoiceRow
              key={choice.value}
              label={choice.label}
              selected={languagePreference === choice.value}
              onPress={() => void setLanguagePreference(choice.value)}
              testID={`language-${choice.value}`}
            />
          ))}
        </View>
      </SettingsGroup>
      <SettingsGroup title={t("clearSavedData")}>
        <Pressable
          accessibilityRole="button"
          accessibilityHint={t("clearSavedDataHint")}
          onPress={confirmClear}
          testID="clear-saved-data"
          style={({ pressed }) => [styles.action, { backgroundColor: pressed ? theme.colors.errorSurface : theme.colors.surface }]}
        >
          <Text style={[styles.actionTitle, { color: theme.colors.error }]}>{t("clearSavedData")}</Text>
          <Text style={[styles.help, { color: theme.colors.muted }]}>{t("clearSavedDataHint")}</Text>
        </Pressable>
      </SettingsGroup>
      <SettingsGroup title={t("about")}>
        <View style={styles.about}>
          <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{getInstitutionDisplayName()}</Text>
          <Text style={[styles.help, { color: theme.colors.muted }]}>{t("appInformation")}</Text>
        </View>
      </SettingsGroup>
      {status ? <Text accessibilityLiveRegion="polite" style={[styles.status, { color: theme.colors.success }]}>{status}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  action: { minHeight: 48, padding: spacing.md, justifyContent: "center" },
  about: { padding: spacing.md, gap: spacing.xs },
  actionTitle: { ...typography.body, fontWeight: "600" },
  help: { ...typography.caption },
  status: { ...typography.caption, fontWeight: "600" },
});
