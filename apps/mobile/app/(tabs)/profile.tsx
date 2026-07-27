/** Redirects the retired profile route to the supported settings destination. */
import { Redirect } from "expo-router";

/** Redirects the retired profile path without leaving a dead navigation destination. */
export default function LegacyProfileRedirect(): JSX.Element {
  return <Redirect href="/(tabs)/settings" />;
}
