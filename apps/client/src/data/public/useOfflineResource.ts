import type { ResourceLoadResult } from "./publicApiRequest";
import { usePublicResource, type PublicResource } from "./usePublicResource";

type OfflineControls = { force?: boolean; signal?: AbortSignal; offlineMode?: boolean };

export function useOfflineResource<T, Q>(
  fetcher: (options: Q & OfflineControls) => Promise<ResourceLoadResult<T>>,
  query: Q,
  key: string
): PublicResource<T> {
  return usePublicResource((controls) => fetcher({ ...query, ...controls, offlineMode: true }), key);
}
