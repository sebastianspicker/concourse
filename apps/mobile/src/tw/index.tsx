import { cssInterop, useUnstableNativeVariable } from "nativewind";
import { Link as RouterLink } from "expo-router";
import React from "react";
import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  TextInput as RNTextInput,
  StyleSheet,
  TouchableHighlight as RNTouchableHighlight
} from "react-native";
type LinkProps = React.ComponentProps<typeof RouterLink> & { className?: string };

cssInterop(RouterLink, { className: "style" });
export const Link = RouterLink as unknown as React.ComponentType<LinkProps>;

export const useCSSVariable =
  process.env.EXPO_OS !== "web"
    ? useUnstableNativeVariable
    : (variable: string) => `var(${variable})`;

export type ViewProps = React.ComponentProps<typeof RNView> & { className?: string };

cssInterop(RNView, { className: "style" });
export const View = RNView as unknown as React.ComponentType<ViewProps>;

cssInterop(RNText, { className: "style" });
export const Text = RNText as unknown as React.ComponentType<React.ComponentProps<typeof RNText> & { className?: string }>;

cssInterop(RNScrollView, {
  className: "style",
  contentContainerClassName: "contentContainerStyle"
});
export const ScrollView = RNScrollView as unknown as React.ComponentType<React.ComponentProps<typeof RNScrollView> & {
  className?: string;
  contentContainerClassName?: string;
}>;

cssInterop(RNPressable, { className: "style" });
export const Pressable = RNPressable as unknown as React.ComponentType<React.ComponentProps<typeof RNPressable> & { className?: string }>;

cssInterop(RNTextInput, { className: "style" });
export const TextInput = RNTextInput as unknown as React.ComponentType<React.ComponentProps<typeof RNTextInput> & { className?: string }>;


function TouchableHighlightInner(
  props: React.ComponentProps<typeof RNTouchableHighlight>
) {
  const flat = StyleSheet.flatten(props.style) as Record<string, unknown> | undefined;
  const { underlayColor, ...style } = flat ?? {};
  return (
    <RNTouchableHighlight
      underlayColor={underlayColor as string}
      {...props}
      style={style as React.ComponentProps<typeof RNTouchableHighlight>["style"]}
    />
  );
}

cssInterop(TouchableHighlightInner, { className: "style" });
export const TouchableHighlight = TouchableHighlightInner as unknown as React.ComponentType<React.ComponentProps<typeof RNTouchableHighlight> & { className?: string }>;

export { Image } from "./image";
