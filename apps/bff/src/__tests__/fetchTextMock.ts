/**
 * Adapts existing connector fixture fetch mocks to the production text-fetch
 * seam without opening DNS or sockets in unit tests.
 */
export async function fetchTextUsingGlobalMock(
  url: string,
  options?: { signal?: AbortSignal }
): Promise<string> {
  const response = await globalThis.fetch(url, { signal: options?.signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}
