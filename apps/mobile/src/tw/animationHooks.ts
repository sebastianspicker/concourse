import RNAnimated, { useSharedValue, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import { useReduceMotion } from "./reducedMotion";

export function useAnimationDuration(duration: number): number {
  const reduceMotion = useReduceMotion();
  return reduceMotion ? 0 : duration;
}

export function useAnimationConfig<T extends { duration?: number; delay?: number }>(config: T): T {
  const reduceMotion = useReduceMotion();
  return reduceMotion ? { ...config, duration: 0, delay: 0 } : config;
}

export function useFadeIn(duration: number = 300): {
  opacity: RNAnimated.SharedValue<number>;
  reduceMotion: boolean;
} {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = reduceMotion ? 1 : withTiming(1, { duration });
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
    scale.value = reduceMotion ? toScale : withTiming(toScale, { duration });
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
    translateY.value = reduceMotion ? toTranslateY : withTiming(toTranslateY, { duration });
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
    opacity.value = reduceMotion ? 1 : withTiming(1, { duration });
    translateY.value = reduceMotion ? 0 : withTiming(0, { duration });
  }, [reduceMotion, duration, opacity, translateY]);

  return { opacity, translateY, reduceMotion };
}

export function useReducedMotionValue<T extends number>(
  animatedValue: RNAnimated.SharedValue<T>,
  staticValue: T
): RNAnimated.SharedValue<T> {
  const reduceMotion = useReduceMotion();
  if (reduceMotion) animatedValue.value = staticValue;
  return animatedValue;
}
