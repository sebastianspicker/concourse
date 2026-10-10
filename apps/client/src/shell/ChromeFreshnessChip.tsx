/** Header status column: the freshness of the data on the visible screen, as lamp plus words. */
import { StatusTag } from "@/design-system/StatusLamp";
import { useChromeStatus } from "./ChromeStatusContext";

export function ChromeFreshnessChip(): JSX.Element | null {
  const status = useChromeStatus();
  if (status === null) return null;
  return <StatusTag testID="chrome-status" label={status.label} tone={status.tone} shape={status.lamp} live />;
}
