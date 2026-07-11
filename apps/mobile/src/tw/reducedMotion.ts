import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Hook to check if reduce motion is enabled.
 * Returns true when the user has enabled "Reduce Motion" in system accessibility settings.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
