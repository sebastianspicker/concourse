import React, { Component, type ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeProvider";
import { Button } from "@/design-system/Button";
import { useLocale } from "@/localization/LocaleContext";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  panel: { width: "100%", maxWidth: 480, alignSelf: "center", gap: spacing.md, borderTopWidth: 2, paddingTop: spacing.lg },
  label: { ...typography.label },
  title: { ...typography.heading },
  message: { ...typography.body },
  action: { marginTop: spacing.sm },
});

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorFallback({
  onReset,
}: {
  onReset: () => void;
}): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View accessibilityRole="alert" style={[styles.panel, { borderTopColor: theme.colors.error }]}>
        <Text style={[styles.label, { color: theme.colors.error }]}>{t("errorLabel")}</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
          {t("errorTitleGeneric")}
        </Text>
        <Text style={[styles.message, { color: theme.colors.muted }]}>
          {t("errorUnknown")}
        </Text>
        <View style={styles.action}>
          <Button variant="primary" icon="refresh" label={t("tryAgain")} onPress={onReset} />
        </View>
      </View>
    </View>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("react_error_boundary_caught", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false });
  };

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
