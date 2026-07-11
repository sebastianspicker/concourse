import * as TW from "./index";
import RNAnimated, { Easing } from "react-native-reanimated";

export const Animated = {
  ...RNAnimated,
  View: RNAnimated.createAnimatedComponent(TW.View)
};

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

export { useReduceMotion } from "./reducedMotion";
export {
  useAnimationConfig,
  useAnimationDuration,
  useFadeIn,
  useFadeSlideAnimation,
  useReducedMotionValue,
  useScaleAnimation,
  useSlideAnimation,
} from "./animationHooks";
export { AnimationPresets, getPlatformAnimation, PlatformAnimations } from "./platformAnimation";
