import { ErrorState } from "./ErrorState";

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
