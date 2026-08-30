export function GET(): Response {
  return Response.json({ status: "ok", source: "expo-api-route" });
}
