import { clearCache } from "./cache";
import { clearPersistedCache } from "./persistedCache";
import { clearSelectedDetailRecords } from "./selectedDetailRecords";
import { cancelScheduledPublicDataRecovery } from "./publicDataRecovery";

const clearListeners = new Set<() => void>();

/** Lets mounted resources cancel their consumer and finish local spinners without discarding data. */
export function subscribePublicDataClear(listener: () => void): () => void {
  clearListeners.add(listener);
  return () => clearListeners.delete(listener);
}

export async function clearPublicDataState(): Promise<void> {
  const deletion = clearPersistedCache();
  cancelScheduledPublicDataRecovery();
  clearCache();
  for (const listener of clearListeners) listener();
  clearSelectedDetailRecords();
  await deletion;
}
