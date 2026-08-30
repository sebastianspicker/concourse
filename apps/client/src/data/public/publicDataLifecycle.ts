import { clearCache } from "./cache";
import { clearPersistedCache } from "./persistedCache";
import { clearSelectedDetailRecords } from "./selectedDetailRecords";

export async function clearPublicDataState(): Promise<void> {
  clearCache();
  clearSelectedDetailRecords();
  await clearPersistedCache();
}
