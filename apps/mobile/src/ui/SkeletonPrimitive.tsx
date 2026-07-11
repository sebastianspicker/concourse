import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";
import { scaled, scaledRadius } from "./theme";
import { useTheme } from "./ThemeContext";

export type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({
  width = 300,
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonProps): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;
  const skeletonHeight = Math.max(2, scaled(height, ui));
  const skeletonRadius = scaledRadius(borderRadius, ui);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.02, 1],
  });

  const animatedStyle: Animated.WithAnimatedValue<ViewStyle> = {
    width: width as Animated.WithAnimatedValue<ViewStyle>["width"],
    height: skeletonHeight,
    borderRadius: skeletonRadius,
    opacity,
    backgroundColor: theme.colors.muted,
    transform: [{ scaleX: scale }],
  };

  return <Animated.View style={[animatedStyle, style]} />;
}
