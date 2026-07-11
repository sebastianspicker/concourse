import React, { Component, type ReactNode } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { spacing, typography } from "../ui/theme";
import { useTheme } from "../ui/ThemeContext";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
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

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}): JSX.Element {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={styles.errorIcon}>😵</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Oops, something broke!
      </Text>
      <Text style={[styles.message, { color: theme.colors.muted }]}>
        {error?.message || "An unexpected error occurred. Give it another try."}
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.colors.accent, borderRadius: 12 },
          pressed && styles.buttonPressed,
        ]}
        onPress={onReset}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text style={[styles.buttonText, { color: theme.colors.accentText }]}>
          Try Again
        </Text>
      </Pressable>
    </View>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("react_error_boundary_caught", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
