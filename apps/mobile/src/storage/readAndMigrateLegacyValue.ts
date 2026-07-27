/** Reads a renamed value while safely completing its one-time storage-key migration. */
export type StorageValueReader = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/**
 * Gives the current key precedence, then copies a legacy value before attempting
 * deletion. Callers invoke this from effects, so a slow storage adapter never
 * delays the initial application render.
 */
export async function readAndMigrateLegacyValue(
  storage: StorageValueReader,
  currentKey: string,
  legacyKey: string,
  normalizeLegacyValue: (value: string) => string = (value) => value,
): Promise<string | null> {
  const currentValue = await storage.getItem(currentKey);
  if (currentValue !== null) return currentValue;

  const legacyValue = await storage.getItem(legacyKey);
  if (legacyValue === null) return null;

  const migratedValue = normalizeLegacyValue(legacyValue);
  try {
    await storage.setItem(currentKey, migratedValue);
  } catch {
    // Keep using the legacy value for this session; the next launch can retry.
    return legacyValue;
  }

  await storage.removeItem(legacyKey).catch(() => undefined);
  return migratedValue;
}
