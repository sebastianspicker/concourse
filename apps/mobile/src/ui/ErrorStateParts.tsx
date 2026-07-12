import React from "react";
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

function getErrorIcon(errorType: ErrorType): "wifi-off" | "search-off" | "error-outline" {
  if (errorType === "network") return "wifi-off";
  if (errorType === "notFound") return "search-off";
  return "error-outline";
}

export function ErrorStateIcon({ errorType }: { errorType: ErrorType }): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;
  const iconCircleSize = scaled(80, ui);

  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.iconCircle,
          {
            borderColor: theme.colors.accent,
            borderWidth: ui.emphasisBorderWidth,
            width: iconCircleSize,
            height: iconCircleSize,
            borderRadius: Math.round(iconCircleSize / 2),
          },
        ]}
      >
        <MaterialIcons name={getErrorIcon(errorType)} size={36} color={theme.colors.error} />
      </View>
    </View>
  );
}

export function ErrorStateTitle({ title }: { title: string }): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <Text
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
  const buttonRadius = scaled(8, ui);

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
              borderRadius: buttonRadius,
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
              borderRadius: buttonRadius,
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
