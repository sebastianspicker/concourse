import { cssInterop } from "nativewind";
import React from "react";
import { StyleSheet } from "react-native";
import { Image as RNImage } from "expo-image";

type RNImageProps = React.ComponentProps<typeof RNImage>;

function CSSImage(props: RNImageProps) {
  const flat = StyleSheet.flatten(props.style) as Record<string, unknown> | undefined;
  const { objectFit, objectPosition, ...style } = flat ?? {};
  return (
    <RNImage
      contentFit={objectFit as RNImageProps["contentFit"]}
      contentPosition={objectPosition as RNImageProps["contentPosition"]}
      {...props}
      source={
        typeof props.source === "string" ? { uri: props.source } : props.source
      }
      style={style as RNImageProps["style"]}
    />
  );
}

export type ImageProps = RNImageProps & { className?: string };

// Wrap CSSImage with NativeWind's cssInterop
cssInterop(CSSImage, { className: "style" });

export const Image = CSSImage as React.ComponentType<ImageProps>;
Image.displayName = "CSS(Image)";
