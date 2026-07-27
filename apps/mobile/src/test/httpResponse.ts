/** Creates the fetch-response surface used by mobile unit tests without a network listener. */
export function jsonResponse(
  body: unknown,
  status = 200,
  getHeader: (name: string) => string | null = () => null,
) {
  return {
    headers: { get: getHeader },
    json: async () => body,
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}
