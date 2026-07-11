import type { ErrorType } from "./ErrorState";

const ERROR_TITLES: Record<ErrorType, string> = {
  network: "Connection Error",
  notFound: "Not Found",
  generic: "Something Went Wrong",
};

export function getErrorConfig(errorType: ErrorType): { title: string } {
  return { title: ERROR_TITLES[errorType] };
}
