import { Platform } from "react-native";
import type { useTheme } from "@/ui/ThemeContext";
type Theme = ReturnType<typeof useTheme>;
export function getHeaderOptions(theme: Theme): object { return { headerShown: true, headerStyle: { backgroundColor: theme.colors.background, ...Platform.select({ ios: { shadowColor: "transparent" }, android: { elevation: 0 } }) }, headerTitleStyle: { color: theme.colors.text, fontWeight: "700", fontSize: 17, letterSpacing: -0.3 }, headerTintColor: theme.colors.accent }; }
