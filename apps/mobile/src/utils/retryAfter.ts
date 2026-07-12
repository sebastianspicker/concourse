function parseRetryAfterDate(retryAfter: string): number | undefined {
  const date = new Date(retryAfter);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000));
}

export function parseRetryAfterSeconds(retryAfter: string | null): number | undefined {
  if (!retryAfter) {
    return undefined;
  }

  // Retry-After can be either delay seconds or an absolute HTTP-date.
  const seconds = Number.parseInt(retryAfter, 10);
  return Number.isNaN(seconds) ? parseRetryAfterDate(retryAfter) : seconds;
}
