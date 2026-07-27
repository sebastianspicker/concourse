/** Supplies network, not-found, and generic defaults around the common error surface. */
import { ErrorState } from "./ErrorState";

/** Preconfigures ErrorState for recoverable network failures. */
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

/** Preconfigures ErrorState for a resource that no longer exists. */
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

/** Preconfigures ErrorState for failures without a specialized recovery path. */
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
