/** Contains accessible icon, copy, and action primitives shared by error surfaces. */
import { Pressable, StyleSheet, Text, View } from "react-native";
import { scaled, scaledFont, spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";
import type { ErrorType } from "./ErrorState";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocale } from "../i18n/LocaleContext";

const styles = StyleSheet.create({
  iconContainer: {
    marginBottom: spacing.md,
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.subheading,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.lg,
    maxWidth: 300,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  retryIcon: {
    fontSize: 16,
  },
  retryText: {
    ...typography.body,
    fontWeight: "600",
  },
  goBackButton: {},
  goBackText: {
    ...typography.body,
    fontWeight: "500",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});

/** Chooses a distinct icon for network, not-found, and generic failures. */
function getErrorIcon(errorType: ErrorType): "wifi-off" | "search-off" | "error-outline" {
  if (errorType === "network") return "wifi-off";
  if (errorType === "notFound") return "search-off";
  return "error-outline";
}

/** Renders the failure icon inside a themed circular affordance. */
export function ErrorStateIcon({ errorType }: { errorType: ErrorType }): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;
  const iconCircleSize = scaled(56, ui);

  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.colors.errorSurface,
            borderColor: theme.colors.error,
            borderWidth: ui.borderWidth,
            width: iconCircleSize,
            height: iconCircleSize,
            borderRadius: Math.round(iconCircleSize / 2),
          },
        ]}
      >
        <MaterialIcons name={getErrorIcon(errorType)} size={28} color={theme.colors.error} />
      </View>
    </View>
  );
}

/** Displays the localized failure title with the shared error-state typography. */
export function ErrorStateTitle({ title }: { title: string }): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <Text
      accessibilityRole="header"
      style={[
        styles.title,
        {
          color: theme.colors.text,
          fontSize: scaledFont(typography.subheading.fontSize, ui),
          lineHeight: scaledFont(typography.subheading.lineHeight, ui),
        },
      ]}
    >
      {title}
    </Text>
  );
}

/** Displays selectable diagnostic copy so users can report or copy it accurately. */
export function ErrorStateMessage({ message }: { message: string }): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <Text
      selectable
      style={[
        styles.message,
        {
          color: theme.colors.muted,
          fontSize: scaledFont(typography.body.fontSize, ui),
          lineHeight: scaledFont(typography.body.lineHeight, ui),
        },
      ]}
    >
      {message}
    </Text>
  );
}

/** Presents retry and optional back navigation actions in the prescribed order. */
export function ErrorStateActions({
  onRetry,
  showGoBackAction,
  onGoBack,
}: {
  onRetry?: () => void;
  showGoBackAction: boolean;
  onGoBack: () => void;
}): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const ui = theme.ui;
  const bodySize = scaledFont(typography.body.fontSize, ui);
  const bodyLineHeight = scaledFont(typography.body.lineHeight, ui);
  const buttonPaddingHorizontal = scaled(spacing.lg, ui);
  const buttonPaddingVertical = scaled(spacing.sm, ui);

  return (
    <View style={styles.actionsContainer}>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            {
              backgroundColor: theme.colors.accent,
              paddingHorizontal: buttonPaddingHorizontal,
              paddingVertical: buttonPaddingVertical,
              minHeight: scaled(44, ui),
            },
            pressed && styles.buttonPressed
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("tryAgain")}
          accessibilityHint="Attempts to load the content again"
        >
          <MaterialIcons name="refresh" size={20} color={theme.colors.accentText} />
          <Text
            style={[
              styles.retryText,
              {
                color: theme.colors.accentText,
                fontSize: bodySize,
                lineHeight: bodyLineHeight,
              },
            ]}
          >
            {t("tryAgain")}
          </Text>
        </Pressable>
      )}
      {showGoBackAction && (
        <Pressable
          onPress={onGoBack}
          style={({ pressed }) => [
            styles.goBackButton,
            {
              borderColor: theme.colors.border,
              borderWidth: ui.borderWidth,
              paddingHorizontal: buttonPaddingHorizontal,
              paddingVertical: buttonPaddingVertical,
              minHeight: scaled(44, ui),
            },
            pressed && styles.buttonPressed
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("goBack")}
          accessibilityHint="Returns to the previous screen"
        >
          <Text
            style={[
              styles.goBackText,
              {
                color: theme.colors.text,
                fontSize: bodySize,
                lineHeight: bodyLineHeight,
              },
            ]}
          >
            {t("goBack")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
