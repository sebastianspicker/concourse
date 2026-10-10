/** Renders recoverable error feedback with optional retry and safe back navigation. */
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "expo-router";
import { Button } from "./Button";
import { StatusLamp } from "./StatusLamp";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeProvider";
import type { UiError } from "@/platform/http/uiError";
import { useLocale } from "@/localization/LocaleContext";
import {
  getErrorMessage,
  getErrorTitleKey,
  getErrorType,
  type ErrorType,
} from "./errorStatePresentation";

export type ErrorStateProps = {
  message?: string;
  error?: UiError;
  errorType?: ErrorType;
  onRetry?: () => void;
  onGoBack?: () => void;
  showGoBack?: boolean;
};

const styles = StyleSheet.create({
  container: { gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xl, paddingHorizontal: spacing.xs },
  heading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { ...typography.heading, flexShrink: 1 },
  message: { ...typography.body, maxWidth: 520 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
});

/** Presents retry and optional back navigation actions in the prescribed order. */
function ErrorStateActions({
  onRetry,
  showGoBackAction,
  onGoBack,
}: {
  onRetry?: () => void;
  showGoBackAction: boolean;
  onGoBack: () => void;
}): JSX.Element | null {
  const { t } = useLocale();
  if (!onRetry && !showGoBackAction) return null;
  return (
    <View style={styles.actions}>
      {onRetry ? (
        <Button variant="primary" icon="refresh" label={t("tryAgain")} accessibilityHint={t("retryHint")} onPress={onRetry} />
      ) : null}
      {showGoBackAction ? (
        <Button variant="secondary" icon="arrow-back" label={t("goBack")} accessibilityHint={t("goBackHint")} onPress={onGoBack} />
      ) : null}
    </View>
  );
}

/** Renders an actionable, accessible failure surface with navigation-aware retry and back behavior. */
export function ErrorState({
  message,
  error,
  errorType,
  onRetry,
  onGoBack,
  showGoBack = false,
}: ErrorStateProps): JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation();
  const { t } = useLocale();
  const resolvedErrorType = getErrorType(error, errorType);
  const resolvedMessage = getErrorMessage(error, message, t);
  const showGoBackAction = showGoBack || navigation.canGoBack();

  /** Uses the supplied navigation callback first, then falls back to router history when possible. */
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={styles.container}
    >
      <View style={styles.heading}>
        <StatusLamp shape="crossed" color={theme.colors.error} size={12} />
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
          {t(getErrorTitleKey(resolvedErrorType))}
        </Text>
      </View>
      <Text selectable style={[styles.message, { color: theme.colors.muted }]}>{resolvedMessage}</Text>
      <ErrorStateActions onRetry={onRetry} showGoBackAction={showGoBackAction} onGoBack={handleGoBack} />
    </View>
  );
}
