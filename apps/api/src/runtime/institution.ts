import { getInstitutionPack, type InstitutionPack } from "@concourse/institutions";

export type { InstitutionPack };

let cachedPack: InstitutionPack | null = null;

export function loadInstitutionPack(
  institutionId: string
): InstitutionPack {
  if (cachedPack && cachedPack.id === institutionId) {
    return cachedPack;
  }
  cachedPack = getInstitutionPack(institutionId);
  return cachedPack;
}
