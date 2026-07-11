import React from "react";
import { StyleSheet, View } from "react-native";
import { getDemoSession } from "@/auth/session";
import { ProfileAvatar } from "@/screens/profileAvatar";
import { ProfileIdentity } from "@/screens/profileIdentity";
import { scaledRadius, scaled, spacing } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";

type DemoSession = ReturnType<typeof getDemoSession>;

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderCurve: "continuous",
  },
});

export function ProfileCard({ session }: { session: DemoSession }): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <View
      style={[
        styles.profileCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: ui.borderWidth,
          borderRadius: scaledRadius(20, ui),
          padding: scaled(spacing.xl, ui),
        },
      ]}
    >
      <ProfileAvatar session={session} />
      <ProfileIdentity session={session} />
    </View>
  );
}
