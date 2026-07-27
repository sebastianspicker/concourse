/** Writes structured BFF logs with safe metadata handling. */

export type LogLevel = "debug" | "info" | "warn" | "error";

/** Emits structured logs after recursively redacting sensitive context fields. */
export function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    context: sanitizeContext(context)
  };

  console.log(JSON.stringify(payload));
}

const BLOCKED_KEYS = new Set(
  [
    "authorization",
    "cookie",
    "set-cookie",
    "password",
    "token",
    "accesstoken",
    "refreshtoken"
  ].map((k) => k.toLowerCase())
);

function isBlocked(key: string): boolean {
  return BLOCKED_KEYS.has(key.toLowerCase());
}

/** Filters blocked context keys and recursively sanitizes the remaining log metadata. */
function sanitizeContext(
  context: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!context) return {};

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (isBlocked(key)) continue;
    result[key] = sanitizeValue(value);
  }
  return result;
}

/** Redacts nested log values while bounding recursion and handling cycles safely. */
function sanitizeValue(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (value === null || typeof value !== "object") return value;

  // Bound recursive serialization work and prevent stack overflow.
  if (depth > 10) return "[Depth Limit]";

  if (seen.has(value)) {
    return "[Circular]";
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v, seen, depth + 1));
  }

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (isBlocked(k)) continue;
    out[k] = sanitizeValue(v, seen, depth + 1);
  }
  return out;
}
