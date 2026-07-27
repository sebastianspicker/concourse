/** Contains unexpected render failures and offers a themed recovery action. */
import React, { Component, type ReactNode } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { spacing, typography } from "../ui/theme";
import { useTheme } from "../ui/ThemeContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocale } from "../i18n/LocaleContext";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  errorIcon: { marginBottom: spacing.md },
  title: {
    ...typography.subheading,
    fontWeight: "bold",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  message: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    ...typography.body,
    fontWeight: "600",
  },
});

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Displays the recoverable application fallback after a descendant render failure. */
function ErrorFallback({
  onReset,
}: {
  onReset: () => void;
}): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.errorIcon}><MaterialIcons name="error-outline" size={48} color={theme.colors.error} /></View>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t("errorTitleGeneric")}
      </Text>
      <Text style={[styles.message, { color: theme.colors.muted }]}>
        {t("errorUnknown")}
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent, borderWidth: theme.ui.borderWidth },
          pressed && styles.buttonPressed,
        ]}
        onPress={onReset}
        accessibilityRole="button"
        accessibilityLabel={t("tryAgain")}
      >
        <Text style={[styles.buttonText, { color: theme.colors.accentText }]}>
          {t("tryAgain")}
        </Text>
      </Pressable>
    </View>
  );
}

/** Captures descendant rendering failures and offers an explicit retry back into the protected subtree. */
export class ErrorBoundary extends Component<Props, State> {
  /** Initializes the boundary in its non-failed state before rendering descendants. */
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /** Converts a descendant render failure into state that switches the boundary to its fallback. */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /** Logs the captured render failure while keeping the fallback visible to the user. */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("react_error_boundary_caught", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  /** Clears captured failure state so the protected subtree can be attempted again. */
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  /** Switches between protected descendants and the localized recovery surface. */
  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
