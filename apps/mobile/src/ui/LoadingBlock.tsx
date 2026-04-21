import React from "react";
import { ActivityIndicator, View } from "react-native";

export function LoadingBlock(): JSX.Element {
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar">
      <ActivityIndicator />
    </View>
  );
}
