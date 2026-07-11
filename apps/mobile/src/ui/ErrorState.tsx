import React from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "expo-router";
import { spacing } from "./theme";
import {
  ErrorStateActions,
  ErrorStateIcon,
  ErrorStateMessage,
  ErrorStateTitle,
} from "./ErrorStateParts";
import { getErrorConfig } from "./errorConfig";

export type ErrorType = "network" | "notFound" | "generic";

export type ErrorStateProps = {
  message: string;
  errorType?: ErrorType;
  onRetry?: () => void;
  onGoBack?: () => void;
  showGoBack?: boolean;
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: spacing.lg,
    flex: 1,
    justifyContent: "center",
  },
});

export function ErrorState({
  message, 
  errorType = "generic",
  onRetry, 
  onGoBack,
  showGoBack = false 
}: ErrorStateProps): JSX.Element {
  const navigation = useNavigation();
  const errorConfig = getErrorConfig(errorType);
  const showGoBackAction = showGoBack || navigation.canGoBack();

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <ErrorStateIcon errorType={errorType} />
      <ErrorStateTitle title={errorConfig.title} />
      <ErrorStateMessage message={message} />
      <ErrorStateActions
        onRetry={onRetry}
        showGoBackAction={showGoBackAction}
        onGoBack={handleGoBack}
      />
    </View>
  );
}

export { GenericError, NetworkError, NotFoundError } from "./ErrorStateWrappers";
