import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getDemoSession } from "@/auth/session";
import { scaled, withOpacity } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";

type DemoSession = ReturnType<typeof getDemoSession>;

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "700",
  },
});

export function ProfileAvatar({ session }: { session: DemoSession }): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;
  const avatarSize = scaled(64, ui);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: withOpacity(theme.colors.accent, 0.15),
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: scaled(28, ui) }]}>
        {session.displayName.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
