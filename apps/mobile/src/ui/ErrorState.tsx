import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "expo-router";
import { scaled, scaledFont, spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

export type ErrorType = "network" | "notFound" | "generic";

export type ErrorStateProps = {
  message: string;
  errorType?: ErrorType;
  onRetry?: () => void;
  onGoBack?: () => void;
  showGoBack?: boolean;
};

function getErrorConfig(errorType: ErrorType): { title: string } {
  switch (errorType) {
    case "network":
      return { title: "Connection Error" };
    case "notFound":
      return { title: "Not Found" };
    case "generic":
    default:
      return { title: "Something Went Wrong" };
  }
}

export function ErrorState({
  message, 
  errorType = "generic",
  onRetry, 
  onGoBack,
  showGoBack = false 
}: ErrorStateProps): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;
  const navigation = useNavigation();
  const errorConfig = getErrorConfig(errorType);

  const titleSize = scaledFont(typography.subheading.fontSize, ui);
  const titleLineHeight = scaledFont(typography.subheading.lineHeight, ui);
  const bodySize = scaledFont(typography.body.fontSize, ui);
  const bodyLineHeight = scaledFont(typography.body.lineHeight, ui);
  const retryPaddingHorizontal = scaled(spacing.lg, ui);
  const retryPaddingVertical = scaled(spacing.sm, ui);
  const buttonRadius = scaled(8, ui);
  const iconCircleSize = scaled(80, ui);

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Icon */}
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
          <Text style={styles.iconText}>
            {errorType === "network" ? "📡" : errorType === "notFound" ? "🔍" : "⚠️"}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: titleSize,
            lineHeight: titleLineHeight,
          },
        ]}
      >
        {errorConfig.title}
      </Text>

      {/* Message */}
      <Text
        selectable
        style={[
          styles.message,
          {
            color: theme.colors.muted,
            fontSize: bodySize,
            lineHeight: bodyLineHeight,
          },
        ]}
      >
        {message}
      </Text>

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        {onRetry && (
          <Pressable 
            onPress={onRetry} 
            style={({ pressed }) => [
              styles.retryButton,
              {
                backgroundColor: theme.colors.accent,
                paddingHorizontal: retryPaddingHorizontal,
                paddingVertical: retryPaddingVertical,
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

        {(showGoBack || navigation.canGoBack()) && (
          <Pressable 
            onPress={handleGoBack} 
            style={({ pressed }) => [
              styles.goBackButton,
              {
                borderColor: theme.colors.border,
                borderWidth: ui.borderWidth,
                paddingHorizontal: retryPaddingHorizontal,
                paddingVertical: retryPaddingVertical,
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
    </View>
  );
}

export function NetworkError({
  message = "Please check your internet connection and try again.",
  onRetry 
}: { 
  message?: string;
  onRetry?: () => void;
}): JSX.Element {
  return (
    <ErrorState 
      message={message} 
      errorType="network" 
      onRetry={onRetry} 
    />
  );
}

export function NotFoundError({
  message = "The item you're looking for doesn't exist or has been removed.",
  showGoBack = true 
}: { 
  message?: string;
  showGoBack?: boolean;
}): JSX.Element {
  return (
    <ErrorState 
      message={message} 
      errorType="notFound" 
      showGoBack={showGoBack} 
    />
  );
}

export function GenericError({
  message = "An unexpected error occurred. Please try again.",
  onRetry 
}: { 
  message?: string;
  onRetry?: () => void;
}): JSX.Element {
  return (
    <ErrorState 
      message={message} 
      errorType="generic" 
      onRetry={onRetry} 
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: spacing.lg,
    flex: 1,
    justifyContent: "center",
  },
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
  goBackButton: {
  },
  goBackText: {
    ...typography.body,
    fontWeight: "500",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
