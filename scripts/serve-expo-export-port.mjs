/** Validates the loopback port used by the static Expo-export server. */
const DECIMAL_PORT = /^\d+$/;

/** Parses a strict decimal TCP port so partial or ambiguous values cannot bind unexpectedly. */
export function parsePort(value, fallback = 8081) {
  const candidate = (value ?? String(fallback)).trim();
  if (!DECIMAL_PORT.test(candidate)) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  const port = Number(candidate);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
}
