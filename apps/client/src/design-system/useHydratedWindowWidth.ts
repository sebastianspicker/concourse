/** Defers responsive width until hydration to keep server and client layouts consistent. */
import { useSyncExternalStore } from "react";
import { useWindowDimensions } from "react-native";

/** Supplies a stable no-op subscription because only hydration state is observed here. */
const subscribe = (): (() => void) => () => undefined;
/** Marks the browser snapshot as hydrated so device width can be read after client mount. */
const getClientSnapshot = (): boolean => true;
/** Keeps server rendering width-neutral until the browser snapshot takes over. */
const getServerSnapshot = (): boolean => false;

/** Returns zero until hydration so server rendering cannot commit to a device-specific layout. */
export function useHydratedWindowWidth(): number {
  const { width } = useWindowDimensions();
  const hydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  return hydrated ? width : 0;
}
