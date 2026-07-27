/** Registers the public institution packs available to both the BFF and mobile build. */
import { InstitutionPackSchema, type InstitutionPack } from "@concourse/shared";
import { examplePublicPack } from "./packs/example.public";
import { hfmtPublicPack } from "./packs/hfmt.public";
import { mockuniPublicPack } from "./packs/mockuni.public";

const packs = {
  example: examplePublicPack,
  hfmt: hfmtPublicPack,
  mockuni: mockuniPublicPack
} as const;

export type KnownInstitutionId = keyof typeof packs;

/** Returns a schema-validated pack and fails closed for unknown institution ids. */
export function getInstitutionPack(institutionId: string): InstitutionPack {
  const candidate = (packs as Record<string, unknown>)[institutionId];
  if (!candidate) {
    throw new Error(`Unknown institutionId: ${institutionId}`);
  }
  return InstitutionPackSchema.parse(candidate);
}
