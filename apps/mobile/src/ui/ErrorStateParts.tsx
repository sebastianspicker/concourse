import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { scaled, scaledFont, spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";
import type { ErrorType } from "./ErrorState";

const styles = StyleSheet.create({
  iconContainer: {
    marginBottom: spacing.md,
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 36,
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

function getErrorIcon(errorType: ErrorType): string {
  if (errorType === "network") return "📡";
  if (errorType === "notFound") return "🔍";
  return "⚠️";
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
        <Text style={styles.iconText}>{getErrorIcon(errorType)}</Text>
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
          accessibilityLabel="Retry"
          accessibilityHint="Attempts to load the content again"
        >
          <Text style={styles.retryIcon}>🔄</Text>
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
            Retry
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
          accessibilityLabel="Go back"
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
            Go Back
          </Text>
        </Pressable>
      )}
    </View>
  );
}
