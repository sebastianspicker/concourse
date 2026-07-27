/** Validates and exposes the BFF's runtime environment contract. */

import {
  createTrustedProxyMatcher,
  validateTrustedProxyRanges,
  type TrustedProxyMatcher
} from "../utils/trustedProxy";
import type { TrustProxyMode } from "../utils/clientKey";

export type { TrustProxyMode } from "../utils/clientKey";

export type BffEnv = {
  port: number;
  institutionId: string;
  corsOrigins: string[];
  trustProxy: TrustProxyMode;
  trustedProxies: string[];
  trustedProxyMatcher: TrustedProxyMatcher;
  defaultCacheTtl: number;
  rruleExpansionHorizonDays: number;
};

/** Trims a required environment value and rejects missing or whitespace-only input. */
function requireNonEmpty(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${name} is required`);
  }
  return trimmed;
}

const INTEGER_PATTERN = /^-?\d+$/;

/** Accepts only a complete safe integer inside the caller-provided inclusive bounds. */
function parseIntInRange(raw: string, name: string, min: number, max: number): number {
  const trimmed = raw.trim();
  if (!INTEGER_PATTERN.test(trimmed)) {
    throw new Error(`${name} must be an integer`);
  }
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
  return value;
}

const TRUST_PROXY_VALUES: Record<string, TrustProxyMode> = {
  always: "always",
  never: "never"
};

/** Normalizes the explicit proxy mode, defaulting to the fail-closed `never` policy. */
function parseTrustProxy(value: string | undefined): TrustProxyMode {
  if (!value) return "never";
  const normalized = value.trim().toLowerCase();
  const parsed = TRUST_PROXY_VALUES[normalized];
  if (parsed) return parsed;
  throw new Error(`Invalid BFF_TRUST_PROXY: ${value}; use never, always, or BFF_TRUSTED_PROXIES`);
}

const DEFAULT_PORT = 4000;

/** Uses port 4000 by default and translates invalid values into a setting-specific error. */
function parsePort(raw: string | undefined): number {
  if (!raw) return DEFAULT_PORT;
  try {
    return parseIntInRange(raw, "BFF_PORT", 1, 65_535);
  } catch {
    throw new Error(`Invalid BFF_PORT: ${raw}`);
  }
}

const CSV_SEPARATOR = ",";

/** Splits comma-separated settings while discarding whitespace and empty entries. */
function parseCsv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(CSV_SEPARATOR)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Parses and validates trusted proxy ranges before any request can rely on them. */
function parseTrustedProxies(raw: string | undefined): string[] {
  const trustedProxies = parseCsv(raw);
  validateTrustedProxyRanges(trustedProxies);
  return trustedProxies;
}

/** Enables range-based trust implicitly only when ranges exist and no mode overrides them. */
function resolveTrustProxyMode(rawMode: string | undefined, trustedProxies: string[]): TrustProxyMode {
  const mode = parseTrustProxy(rawMode);
  return rawMode === undefined && trustedProxies.length > 0 ? "trusted" : mode;
}

const TRUSTED_PROXIES = parseTrustedProxies(process.env.BFF_TRUSTED_PROXIES);
const TRUSTED_PROXY_MATCHER = createTrustedProxyMatcher(TRUSTED_PROXIES);

export const BFF_ENV: BffEnv = {
  port: parsePort(process.env.BFF_PORT),
  institutionId: requireNonEmpty(process.env.INSTITUTION_ID, "INSTITUTION_ID"),
  corsOrigins: parseCsv(process.env.CORS_ORIGINS),
  trustProxy: resolveTrustProxyMode(process.env.BFF_TRUST_PROXY, TRUSTED_PROXIES),
  trustedProxies: TRUSTED_PROXIES,
  trustedProxyMatcher: TRUSTED_PROXY_MATCHER,
  defaultCacheTtl: parseIntInRange(process.env.BFF_DEFAULT_CACHE_TTL ?? "300", "BFF_DEFAULT_CACHE_TTL", 1, 86_400),
  rruleExpansionHorizonDays: parseIntInRange(process.env.RRULE_EXPANSION_HORIZON_DAYS ?? "90", "RRULE_EXPANSION_HORIZON_DAYS", 1, 366)
};
