import { Platform } from "react-native";

export const AnimationPresets = {
  fast: {
    duration: 150,
  },
  standard: {
    duration: 300,
  },
  slow: {
    duration: 500,
  },
  spring: {
    damping: 15,
    stiffness: 150,
  },
} as const;

export const PlatformAnimations = {
  ios: {
    useSpring: true,
    springConfig: AnimationPresets.spring,
  },
  android: {
    useSpring: false,
    timingConfig: AnimationPresets.standard,
  },
} as const;

export function getPlatformAnimation(): typeof PlatformAnimations.ios | typeof PlatformAnimations.android {
  return Platform.OS === "ios"
    ? PlatformAnimations.ios
    : PlatformAnimations.android;
}
