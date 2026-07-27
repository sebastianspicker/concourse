/** Displays a compact warning when an upstream source returned incomplete data. */
import { StatusBanner } from "../ui/StatusBanner";

type Props = {
  visible: boolean;
  message?: string;
};

/**
 * A subtle banner shown when the BFF returned `_degraded: true`, indicating
 * that some upstream sources failed and the data may be incomplete.
 * Helps students understand why certain events might be missing.
 */
export function DegradedBanner({
  visible,
  message,
}: Props): JSX.Element | null {
  if (!visible) return null;
  return <StatusBanner kind="degraded" message={message} />;
}
