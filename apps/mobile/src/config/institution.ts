/** Institution-aware mobile application configuration. */
import Constants from "expo-constants";
import { getInstitutionPack } from "@concourse/institutions";
import type { InstitutionPack } from "@concourse/shared";

export const DEFAULT_INSTITUTION_ID = "example";

/** Reads the configured institution identifier from the application configuration. */
export function getConfiguredInstitutionId(): string {
  const extra = Constants.expoConfig?.extra as { institutionId?: unknown } | undefined;
  return typeof extra?.institutionId === "string" && extra.institutionId.length > 0
    ? extra.institutionId
    : DEFAULT_INSTITUTION_ID;
}

/** Resolves the selected public institution pack once for mobile configuration consumers. */
export function getConfiguredInstitution(): InstitutionPack {
  return getInstitutionPack(getConfiguredInstitutionId());
}

/** Exposes the selected institution’s human-readable name for branded surfaces. */
export function getInstitutionDisplayName(pack = getConfiguredInstitution()): string {
  return pack.app?.displayName ?? pack.name;
}

/** Exposes the pack’s preferred locale for default translation selection. */
export function getInstitutionLocale(pack = getConfiguredInstitution()): "en" | "de" {
  return pack.app?.defaultLocale ?? "en";
}

/** Exposes the pack’s IANA time zone for campus-date calculations. */
export function getInstitutionTimeZone(pack = getConfiguredInstitution()): string {
  return pack.timezone ?? "UTC";
}
