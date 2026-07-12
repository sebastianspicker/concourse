import { Redirect } from "expo-router";
import React from "react";

export default function LegacyProfileRedirect(): JSX.Element {
  return <Redirect href="/(tabs)/settings" />;
}
