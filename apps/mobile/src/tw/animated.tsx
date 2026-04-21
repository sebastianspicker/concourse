import * as TW from "./index";
import RNAnimated, { withTiming, Easing, useSharedValue } from "react-native-reanimated";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

export const Animated = {
  ...RNAnimated,
  View: RNAnimated.createAnimatedComponent(TW.View)
};

/**
 * Hook to check if reduce motion is enabled
 * Returns true when the user has enabled "Reduce Motion" in system accessibility settings
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    // Listen for changes
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

export type AnimationConfig = {
  duration?: number;
  easing?: (value: number) => number;
  delay?: number;
};

export const Easings = {
  linear: Easing.linear,
  ease: Easing.ease,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  quad: Easing.quad,
  cubic: Easing.cubic,
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),
} as const;

/**
 * Hook that returns appropriate animation duration based on reduce motion setting
 * Returns 0 duration when reduce motion is enabled, otherwise returns the specified duration
 */
export function useAnimationDuration(duration: number): number {
  const reduceMotion = useReduceMotion();
  return reduceMotion ? 0 : duration;
}

/**
 * Hook that returns appropriate animation config based on reduce motion setting
 * When reduce motion is enabled, animations are instant (duration: 0)
 */
export function useAnimationConfig(config: AnimationConfig): AnimationConfig {
  const reduceMotion = useReduceMotion();
  
  if (reduceMotion) {
    return {
      ...config,
      duration: 0,
      delay: 0,
    };
  }
  
  return config;
}

export function useFadeIn(duration: number = 300): {
  opacity: RNAnimated.SharedValue<number>;
  reduceMotion: boolean;
} {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
    } else {
      opacity.value = withTiming(1, { duration });
    }
  }, [reduceMotion, duration, opacity]);

  return { opacity, reduceMotion };
}

export function useScaleAnimation(
  duration: number = 200,
  fromScale: number = 0.95,
  toScale: number = 1
): {
  scale: RNAnimated.SharedValue<number>;
  reduceMotion: boolean;
} {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(fromScale);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = toScale;
    } else {
      scale.value = withTiming(toScale, { duration });
    }
  }, [reduceMotion, duration, scale, toScale]);

  return { scale, reduceMotion };
}

export function useSlideAnimation(
  duration: number = 300,
  fromTranslateY: number = 20,
  toTranslateY: number = 0
): {
  translateY: RNAnimated.SharedValue<number>;
  reduceMotion: boolean;
} {
  const reduceMotion = useReduceMotion();
  const translateY = useSharedValue(fromTranslateY);

  useEffect(() => {
    if (reduceMotion) {
      translateY.value = toTranslateY;
    } else {
      translateY.value = withTiming(toTranslateY, { duration });
    }
  }, [reduceMotion, duration, translateY, toTranslateY]);

  return { translateY, reduceMotion };
}

export function useFadeSlideAnimation(
  duration: number = 300,
  fromTranslateY: number = 20
): {
  opacity: RNAnimated.SharedValue<number>;
  translateY: RNAnimated.SharedValue<number>;
  reduceMotion: boolean;
} {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(fromTranslateY);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
    } else {
      opacity.value = withTiming(1, { duration });
      translateY.value = withTiming(0, { duration });
    }
  }, [reduceMotion, duration, opacity, translateY]);

  return { opacity, translateY, reduceMotion };
}

/**
 * Creates an animated value that respects reduce motion
 * Returns a static value when reduce motion is enabled
 */
export function useReducedMotionValue<T extends number>(
  animatedValue: RNAnimated.SharedValue<T>,
  staticValue: T
): RNAnimated.SharedValue<T> {
  const reduceMotion = useReduceMotion();
  
  if (reduceMotion) {
    animatedValue.value = staticValue;
  }
  
  return animatedValue;
}

export const AnimationPresets = {
  // Fast micro-interactions (button presses, toggles)
  fast: {
    duration: 150,
  },
  // Standard transitions (modals, screens)
  standard: {
    duration: 300,
  },
  // Slow, deliberate animations (onboarding, tutorials)
  slow: {
    duration: 500,
  },
  // Spring-based animations
  spring: {
    damping: 15,
    stiffness: 150,
  },
} as const;

export const PlatformAnimations = {
  // iOS typically uses spring animations
  ios: {
    useSpring: true,
    springConfig: AnimationPresets.spring,
  },
  // Android typically uses timing animations
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

