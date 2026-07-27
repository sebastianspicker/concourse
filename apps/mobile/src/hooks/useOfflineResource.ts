/** Adapts public-resource loaders to an offline-aware hook contract. */
import type { ResourceLoadResult } from "../data/publicApiRequest";
import { usePublicResource, type PublicResource } from "./usePublicResource";

type OfflineControls = { force?: boolean; signal?: AbortSignal; offlineMode?: boolean };

/** Adapts a resource loader to expose its offline and freshness metadata to consuming screens. */
export function useOfflineResource<T, Q>(
  fetcher: (options: Q & OfflineControls) => Promise<ResourceLoadResult<T>>,
  query: Q,
  key: string
): PublicResource<T> {
  return usePublicResource((controls) => fetcher({ ...query, ...controls, offlineMode: true }), key);
}
