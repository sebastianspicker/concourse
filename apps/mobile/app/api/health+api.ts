/**
 * Health check for EAS Hosting / server runtimes.
 * Returns 200 when the API route runtime is up.
 */
export function GET(): Response {
  return Response.json({ status: "ok", source: "expo-api-route" });
}
