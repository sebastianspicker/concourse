export type BffEnv = {
  port: number;
  institutionId: string;
  corsOrigins: string[];
  trustProxy: TrustProxyMode;
  defaultCacheTtl: number;
  rruleExpansionHorizonDays: number;
};

export const BFF_ENV: BffEnv = {
  port: parsePort(process.env.BFF_PORT),
  institutionId: requireNonEmpty(process.env.INSTITUTION_ID, "INSTITUTION_ID"),
  corsOrigins: parseCsv(process.env.CORS_ORIGINS),
  trustProxy: parseTrustProxy(process.env.BFF_TRUST_PROXY),
  defaultCacheTtl: parseIntInRange(process.env.BFF_DEFAULT_CACHE_TTL ?? "300", "BFF_DEFAULT_CACHE_TTL", 1, 86_400),
  rruleExpansionHorizonDays: parseIntInRange(process.env.RRULE_EXPANSION_HORIZON_DAYS ?? "90", "RRULE_EXPANSION_HORIZON_DAYS", 1, 366)
};

export type TrustProxyMode = "never" | "auto" | "always";

function parsePort(raw: string | undefined): number {
  if (!raw) return 4000;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Invalid BFF_PORT: ${raw}`);
  }
  return value;
}

function parseCsv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function requireNonEmpty(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${name} is required`);
  }
  return trimmed;
}

function parseIntInRange(raw: string, name: string, min: number, max: number): number {
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error(`${name} must be an integer`);
  }
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
  return value;
}

function parseTrustProxy(value: string | undefined): TrustProxyMode {
  if (!value) return "never";
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "always"].includes(normalized)) return "always";
  if (["0", "false", "no", "never"].includes(normalized)) return "never";
  if (normalized === "auto") return "auto";
  throw new Error(`Invalid BFF_TRUST_PROXY: ${value}`);
}
