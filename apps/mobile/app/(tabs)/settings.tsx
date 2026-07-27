/** Provides local appearance, language, and cache controls for the mobile client. */
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { clearPersistedCache } from "@/data/persistedCache";
import { clearCache } from "@/data/cache";
import { SignalPageHeader } from "@/components/SignalPageHeader";
import { getInstitutionDisplayName } from "@/config/institution";
import { useLocale, type LanguagePreference } from "@/i18n/LocaleContext";
import { Screen } from "@/ui/Screen";
import { ChoiceRow, SettingsGroup } from "@/ui/SettingsGroup";
import { useTheme, useThemePreference, type ThemePreference } from "@/ui/ThemeContext";
import { spacing, typography } from "@/ui/theme";
import { getDesignPreset } from "@/ui/designPresets";
import { useHydratedWindowWidth } from "@/ui/useHydratedWindowWidth";

type ChoiceValue = ThemePreference | LanguagePreference;
type Translation = ReturnType<typeof useLocale>["t"];
type StatusKind = "success" | "error";

type SettingsChoiceGroupProps<T extends ChoiceValue> = {
  title: string;
  choices: Array<{ value: T; label: string }>;
  selected: T;
  onSelect: (value: T) => void;
  testIDPrefix: string;
};

/** Renders one radio group while leaving preference persistence with the parent screen. */
function SettingsChoiceGroup<T extends ChoiceValue>({
  title,
  choices,
  selected,
  onSelect,
  testIDPrefix,
}: SettingsChoiceGroupProps<T>): JSX.Element {
  return (
    <SettingsGroup title={title}>
      <View accessibilityRole="radiogroup" accessibilityLabel={title}>
        {choices.map((choice) => (
          <ChoiceRow
            key={choice.value}
            label={choice.label}
            selected={selected === choice.value}
            onPress={() => void onSelect(choice.value)}
            testID={`${testIDPrefix}-${choice.value}`}
          />
        ))}
      </View>
    </SettingsGroup>
  );
}

/** Keeps the browser destructive-action confirmation reachable by keyboard. */
function WebClearConfirmation({
  t,
  theme,
  onCancel,
  onConfirm,
}: {
  t: Translation;
  theme: ReturnType<typeof useTheme>;
  onCancel: () => void;
  onConfirm: () => void;
}): JSX.Element {
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.confirmation, { backgroundColor: theme.colors.errorSurface, borderColor: theme.colors.error, borderWidth: theme.ui.borderWidth }]} testID="clear-saved-data-confirmation">
      <Text style={[styles.confirmationTitle, { color: theme.colors.text }]}>{t("clearConfirmTitle")}</Text>
      <Text style={[styles.help, { color: theme.colors.muted }]}>{t("clearConfirmBody")}</Text>
      <View style={styles.confirmationActions}>
        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.confirmationButton} testID="clear-saved-data-cancel">
          <Text style={[styles.confirmationButtonText, { color: theme.colors.text }]}>{t("cancel")}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onConfirm} style={styles.confirmationButton} testID="clear-saved-data-confirm">
          <Text style={[styles.confirmationButtonText, { color: theme.colors.error }]}>{t("clear")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Presents the destructive cache action with the existing localized labels and sizing. */
const ClearSavedDataGroup = ({
  t,
  theme,
  minHeight,
  onPress,
}: {
  t: Translation;
  theme: ReturnType<typeof useTheme>;
  minHeight: number;
  onPress: () => void;
}): JSX.Element => {
  return (
    <SettingsGroup title={t("clearSavedData")}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={t("clearSavedDataHint")}
        onPress={onPress}
        testID="clear-saved-data"
        style={({ pressed }) => [styles.action, { backgroundColor: pressed ? theme.colors.errorSurface : theme.colors.surface, minHeight }]}
      >
        <Text style={[styles.actionTitle, { color: theme.colors.error }]}>{t("clearSavedData")}</Text>
        <Text style={[styles.help, { color: theme.colors.muted }]}>{t("clearSavedDataHint")}</Text>
      </Pressable>
    </SettingsGroup>
  );
};

/** Displays institution metadata using the same row geometry as the destructive action. */
const AboutGroup = ({ t, theme, minHeight }: { t: Translation; theme: ReturnType<typeof useTheme>; minHeight: number }): JSX.Element => {
  return (
    <SettingsGroup title={t("about")}>
      <View style={[styles.about, { minHeight }]}>
        <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{getInstitutionDisplayName()}</Text>
        <Text style={[styles.help, { color: theme.colors.muted }]}>{t("appInformation")}</Text>
      </View>
    </SettingsGroup>
  );
};

/** Lets users persist appearance and language choices or clear saved resource data. */
export default function SettingsScreen(): JSX.Element {
  const theme = useTheme();
  const width = useHydratedWindowWidth();
  const metrics = getDesignPreset(theme.designPreset).metrics;
  const { preference: themePreference, setPreference: setThemePreference } = useThemePreference();
  const { preference: languagePreference, setPreference: setLanguagePreference, t } = useLocale();
  const [status, setStatus] = useState<{ message: string; kind: StatusKind } | null>(null);
  const [webConfirmationVisible, setWebConfirmationVisible] = useState(false);
  const isWide = width >= 900;
  const minHeight = Math.max(52, metrics.rowMinHeight - 12);
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
  const clearSavedData = () => {
    clearCache();
    void clearPersistedCache()
      .then(() => setStatus({ message: t("cleared"), kind: "success" }))
      .catch(() => setStatus({ message: t("errorUnknown"), kind: "error" }));
  };
  const confirmClear = () => {
    if (Platform.OS === "web") {
      setWebConfirmationVisible(true);
      return;
    }
    Alert.alert(t("clearConfirmTitle"), t("clearConfirmBody"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("clear"), style: "destructive", onPress: clearSavedData },
    ]);
  };

  return (
    <Screen maxWidth={1400} testID="settings-screen">
      <SignalPageHeader title={t("settings")} />
      <View style={[styles.settingsGrid, isWide && styles.settingsGridWide]}>
        <View style={styles.settingsColumn}>
          <SettingsChoiceGroup title={t("appearance")} choices={themeChoices} selected={themePreference} onSelect={setThemePreference} testIDPrefix="theme" />
        </View>
        <View style={styles.settingsColumn}>
          <SettingsChoiceGroup title={t("language")} choices={languageChoices} selected={languagePreference} onSelect={setLanguagePreference} testIDPrefix="language" />
        </View>
      </View>
      <View style={[styles.settingsGrid, isWide && styles.settingsGridWide]}>
        <View style={styles.settingsColumn}>
          <ClearSavedDataGroup t={t} theme={theme} minHeight={minHeight} onPress={confirmClear} />
          {webConfirmationVisible ? <WebClearConfirmation t={t} theme={theme} onCancel={() => setWebConfirmationVisible(false)} onConfirm={() => { setWebConfirmationVisible(false); clearSavedData(); }} /> : null}
        </View>
        <View style={styles.settingsColumn}>
          <AboutGroup t={t} theme={theme} minHeight={minHeight} />
        </View>
      </View>
      {status ? <Text accessibilityLiveRegion={status.kind === "error" ? "assertive" : "polite"} style={[styles.status, { color: status.kind === "error" ? theme.colors.error : theme.colors.success }]}>{status.message}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  settingsGrid: { gap: spacing.xxl },
  settingsGridWide: { flexDirection: "row", alignItems: "flex-start" },
  settingsColumn: { flex: 1, minWidth: 0 },
  action: { padding: spacing.md, justifyContent: "center" },
  about: { padding: spacing.md, gap: spacing.xs, justifyContent: "center" },
  confirmation: { gap: spacing.sm, marginTop: spacing.sm, padding: spacing.md },
  confirmationActions: { flexDirection: "row", gap: spacing.md },
  confirmationButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.sm },
  confirmationButtonText: { ...typography.caption, fontWeight: "600" },
  confirmationTitle: { ...typography.body, fontWeight: "600" },
  actionTitle: { ...typography.body, fontWeight: "600" },
  help: { ...typography.caption },
  status: { ...typography.caption, fontWeight: "600" },
});
