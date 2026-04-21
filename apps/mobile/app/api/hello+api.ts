/**
 * Demo API route. Use for server-side logic, secrets, or proxying.
 * See docs/expo-api-routes.md and the expo-api-routes skill.
 */
export function GET(): Response {
  return Response.json({ message: "Hello from Expo API route!" });
}
