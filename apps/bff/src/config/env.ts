import { parsePort } from "./port";

export type BffEnv = {
  port: number;
  institutionId: string;
  corsOrigins: string[];
  trustProxy: TrustProxyMode;
  defaultCacheTtl: number;
  rruleExpansionHorizonDays: number;
};

export type TrustProxyMode = "never" | "auto" | "always";

function requireNonEmpty(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${name} is required`);
  }
  return trimmed;
}

const INTEGER_PATTERN = /^-?\d+$/;

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
  "0": "never",
  "1": "always",
  always: "always",
  auto: "auto",
  false: "never",
  never: "never",
  no: "never",
  true: "always",
  yes: "always"
};

function parseTrustProxy(value: string | undefined): TrustProxyMode {
  if (!value) return "never";
  const normalized = value.trim().toLowerCase();
  const parsed = TRUST_PROXY_VALUES[normalized];
  if (parsed) return parsed;
  throw new Error(`Invalid BFF_TRUST_PROXY: ${value}`);
}

const CSV_SEPARATOR = ",";

function parseCsv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(CSV_SEPARATOR)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const BFF_ENV: BffEnv = {
  port: parsePort(process.env.BFF_PORT),
  institutionId: requireNonEmpty(process.env.INSTITUTION_ID, "INSTITUTION_ID"),
  corsOrigins: parseCsv(process.env.CORS_ORIGINS),
  trustProxy: parseTrustProxy(process.env.BFF_TRUST_PROXY),
  defaultCacheTtl: parseIntInRange(process.env.BFF_DEFAULT_CACHE_TTL ?? "300", "BFF_DEFAULT_CACHE_TTL", 1, 86_400),
  rruleExpansionHorizonDays: parseIntInRange(process.env.RRULE_EXPANSION_HORIZON_DAYS ?? "90", "RRULE_EXPANSION_HORIZON_DAYS", 1, 366)
};
