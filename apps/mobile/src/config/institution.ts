import Constants from "expo-constants";
import { getInstitutionPack } from "@campus/institutions";
import type { InstitutionPack } from "@campus/shared";

export const DEFAULT_INSTITUTION_ID = "example";
export const DEFAULT_ACCENT = "#176B87";

export function getConfiguredInstitutionId(): string {
  const extra = Constants.expoConfig?.extra as { institutionId?: unknown } | undefined;
  return typeof extra?.institutionId === "string" && extra.institutionId.length > 0
    ? extra.institutionId
    : DEFAULT_INSTITUTION_ID;
}

export function getConfiguredInstitution(): InstitutionPack {
  return getInstitutionPack(getConfiguredInstitutionId());
}

export function getInstitutionDisplayName(pack = getConfiguredInstitution()): string {
  return pack.app?.displayName ?? pack.name;
}

export function getInstitutionLocale(pack = getConfiguredInstitution()): "en" | "de" {
  return pack.app?.defaultLocale ?? "en";
}
