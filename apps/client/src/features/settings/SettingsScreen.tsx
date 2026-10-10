/** Provides local appearance, language, and cache controls for the mobile client. */
import { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { clearPublicDataState } from "@/data/public/publicDataLifecycle";
import { PageHeader } from "@/design-system/PageHeader";
import { getInstitutionDisplayName } from "@/platform/env/institution";
import { useLocale, type LanguagePreference } from "@/localization/LocaleContext";
import { Screen } from "@/design-system/Screen";
import { ChoiceRow } from "@/design-system/ChoiceRow";
import { SettingsGroup } from "@/design-system/SettingsGroup";
import { useTheme, useThemePreference, type ThemePreference } from "@/design-system/ThemeProvider";
import { Button } from "@/design-system/Button";
import { StatusLamp } from "@/design-system/StatusLamp";
import { CONTENT_MAX_WIDTH, spacing, typography } from "@/design-system/theme";
import { useHydratedWindowWidth } from "@/design-system/useHydratedWindowWidth";
import { isStaticDemo } from "@/data/public/staticDemo";

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
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.confirmation, { backgroundColor: theme.colors.errorSurface, borderLeftColor: theme.colors.error, borderLeftWidth: theme.ui.emphasisBorderWidth + 2 }]} testID="clear-saved-data-confirmation">
      <Text style={[styles.confirmationTitle, { color: theme.colors.text }]}>{t("clearConfirmTitle")}</Text>
      <Text style={[styles.help, { color: theme.colors.text }]}>{t("clearConfirmBody")}</Text>
      <View style={styles.confirmationActions}>
        <Button variant="secondary" label={t("cancel")} onPress={onCancel} testID="clear-saved-data-cancel" />
        <Button variant="destructive" icon="delete-outline" label={t("clear")} onPress={onConfirm} testID="clear-saved-data-confirm" />
      </View>
    </View>
  );
}

/** Presents the destructive cache action with its consequence stated before the button. */
const ClearSavedDataGroup = ({
  t,
  theme,
  onPress,
  staticDemo,
}: {
  t: Translation;
  theme: ReturnType<typeof useTheme>;
  onPress: () => void;
  staticDemo: boolean;
}): JSX.Element => {
  const label = staticDemo ? `${t("clearSavedData")} · ${t("simulated")}` : t("clearSavedData");
  return (
    <SettingsGroup title={t("savedData")}>
      <View style={styles.block}>
        <Text style={[styles.help, { color: theme.colors.muted }]}>{staticDemo ? t("simulatedClearHint") : t("clearSavedDataHint")}</Text>
        <Button variant="destructive" icon="delete-outline" label={label} accessibilityHint={t("clearSavedDataHint")} onPress={onPress} testID="clear-saved-data" />
      </View>
    </SettingsGroup>
  );
};

/** States what the app is and where its data comes from. */
const AboutGroup = ({ t, theme }: { t: Translation; theme: ReturnType<typeof useTheme> }): JSX.Element => {
  return (
    <SettingsGroup title={t("about")}>
      <View style={styles.block}>
        <Text style={[styles.aboutTitle, { color: theme.colors.text }]}>{getInstitutionDisplayName()}</Text>
        <Text style={[styles.help, { color: theme.colors.muted }]}>{t("appInformation")}</Text>
        <Text style={[styles.product, { color: theme.colors.muted }]}>Concourse</Text>
      </View>
    </SettingsGroup>
  );
};

/** Lets users persist appearance and language choices or clear saved resource data. */
export default function SettingsScreen(): JSX.Element {
  const theme = useTheme();
  const width = useHydratedWindowWidth();
  const { preference: themePreference, setPreference: setThemePreference } = useThemePreference();
  const { preference: languagePreference, setPreference: setLanguagePreference, t } = useLocale();
  const [status, setStatus] = useState<{ message: string; kind: StatusKind } | null>(null);
  const [webConfirmationVisible, setWebConfirmationVisible] = useState(false);
  const isWide = width >= 900;
  const columnStyle = [styles.settingsColumn, isWide && styles.settingsColumnWide];
  const staticDemo = isStaticDemo();
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
    if (staticDemo) {
      setStatus({ message: t("simulatedClearData"), kind: "success" });
      return;
    }
    void clearPublicDataState()
      .then(() => setStatus({ message: t("cleared"), kind: "success" }))
      .catch(() => setStatus({ message: t("errorUnknown"), kind: "error" }));
  };
  const confirmClear = () => {
    if (staticDemo) {
      clearSavedData();
      return;
    }
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
    <Screen maxWidth={CONTENT_MAX_WIDTH} testID="settings-screen">
      <PageHeader title={t("settings")} intro={t("settingsIntro")} />
      <View style={[styles.settingsGrid, isWide && styles.settingsGridWide]}>
        <View style={columnStyle}>
          <SettingsChoiceGroup title={t("appearance")} choices={themeChoices} selected={themePreference} onSelect={setThemePreference} testIDPrefix="theme" />
        </View>
        <View style={columnStyle}>
          <SettingsChoiceGroup title={t("language")} choices={languageChoices} selected={languagePreference} onSelect={setLanguagePreference} testIDPrefix="language" />
        </View>
      </View>
      <View style={[styles.settingsGrid, isWide && styles.settingsGridWide]}>
        <View style={columnStyle}>
          <ClearSavedDataGroup t={t} theme={theme} onPress={confirmClear} staticDemo={staticDemo} />
          {webConfirmationVisible ? <WebClearConfirmation t={t} theme={theme} onCancel={() => setWebConfirmationVisible(false)} onConfirm={() => { setWebConfirmationVisible(false); clearSavedData(); }} /> : null}
          {status ? (
            <View accessibilityLiveRegion={status.kind === "error" ? "assertive" : "polite"} style={styles.statusRow}>
              <StatusLamp shape={status.kind === "error" ? "crossed" : "filled"} color={status.kind === "error" ? theme.colors.error : theme.colors.success} />
              <Text style={[styles.status, { color: theme.colors.text }]}>{status.message}</Text>
            </View>
          ) : null}
        </View>
        <View style={columnStyle}>
          <AboutGroup t={t} theme={theme} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  settingsGrid: { gap: spacing.xxxl },
  settingsGridWide: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xxxl + spacing.lg },
  settingsColumn: { minWidth: 0, gap: spacing.md },
  settingsColumnWide: { flex: 1 },
  block: { gap: spacing.md, paddingTop: spacing.lg },
  confirmation: { gap: spacing.sm, padding: spacing.lg },
  confirmationActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  confirmationTitle: { ...typography.bodyStrong },
  aboutTitle: { ...typography.bodyStrong },
  product: { ...typography.label },
  help: { ...typography.caption },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  status: { ...typography.captionStrong },
});
