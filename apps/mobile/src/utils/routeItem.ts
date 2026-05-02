import type { z } from "zod";

export function serializeRouteItem<T>(item: T): string {
  return JSON.stringify(item);
}

export function parseRouteItem<T>(value: string | string[] | undefined, schema: z.ZodType<T>): T | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
