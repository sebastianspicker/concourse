export function serializeRouteItem<T>(item: T): string {
  return JSON.stringify(item);
}

export function parseRouteItem<T>(value: string | string[] | undefined): T | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
