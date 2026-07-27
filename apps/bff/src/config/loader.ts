/** Loads the validated institution configuration selected for this BFF instance. */

import type { InstitutionPack } from "@concourse/shared";
import { getInstitutionPack } from "@concourse/institutions";

export type { InstitutionPack };

let cachedPack: InstitutionPack | null = null;

/** Loads the named institution pack and rejects IDs that are not bundled configuration. */
export function loadInstitutionPack(
  institutionId: string
): InstitutionPack {
  if (cachedPack && cachedPack.id === institutionId) {
    return cachedPack;
  }
  cachedPack = getInstitutionPack(institutionId);
  return cachedPack;
}
