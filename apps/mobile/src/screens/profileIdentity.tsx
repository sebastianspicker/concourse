import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getDemoSession } from "@/auth/session";
import { scaledFont, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";

type DemoSession = ReturnType<typeof getDemoSession>;

const styles = StyleSheet.create({
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.subheading,
    fontWeight: "600",
  },
  profileId: {
    ...typography.caption,
    marginTop: 2,
  },
});

export function ProfileIdentity({ session }: { session: DemoSession }): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <View style={styles.profileInfo}>
      <Text
        style={[
          styles.profileName,
          {
            color: theme.colors.text,
            fontSize: scaledFont(typography.subheading.fontSize, ui),
            lineHeight: scaledFont(typography.subheading.lineHeight, ui),
          },
        ]}
      >
        {session.displayName}
      </Text>
      <Text
        style={[
          styles.profileId,
          {
            color: theme.colors.muted,
            fontSize: scaledFont(typography.caption.fontSize, ui),
            lineHeight: scaledFont(typography.caption.lineHeight, ui),
          },
        ]}
      >
        {session.userId}
      </Text>
    </View>
  );
}
