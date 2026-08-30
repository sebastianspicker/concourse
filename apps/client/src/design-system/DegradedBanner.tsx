import { StatusBanner } from "./StatusBanner";

type Props = {
  visible: boolean;
  message?: string;
};

export function DegradedBanner({
  visible,
  message,
}: Props): JSX.Element | null {
  if (!visible) return null;
  return <StatusBanner kind="degraded" message={message} />;
}
