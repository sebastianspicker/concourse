import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getDemoSession } from "../../src/auth/session";
import { ProfileCard } from "@/screens/profileCard";
import { THEME_OPTIONS, ThemeOptionButton } from "@/screens/profileThemeOptions";
import { Screen } from "@/ui/Screen";
import { Section } from "@/ui/Section";
import { useTheme, useThemePreference } from "@/ui/ThemeContext";
import { typography, spacing } from "@/ui/theme";

const styles = StyleSheet.create({
  note: {
    ...typography.caption,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  themeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});

function DemoSessionNote({ visible }: { visible: boolean }): JSX.Element | null {
  const theme = useTheme();
  if (!visible) return null;
  return (
    <Text style={[styles.note, { color: theme.colors.muted }]}>
      Demo session -- connect your university auth to personalize.
    </Text>
  );
}

function AppearanceOptions(): JSX.Element {
  const { preference, setPreference } = useThemePreference();
  return (
    <View style={styles.themeOptions}>
      {THEME_OPTIONS.map((option) => (
        <ThemeOptionButton
          key={option.value}
          option={option}
          selected={preference === option.value}
          onSelect={setPreference}
        />
      ))}
    </View>
  );
}

export default function ProfileScreen(): JSX.Element {
  const session = getDemoSession();

  return (
    <Screen>
      <Section title="Profile">
        <ProfileCard session={session} />
        <DemoSessionNote visible={Boolean(session.isDemo)} />
      </Section>
      <Section title="Appearance">
        <AppearanceOptions />
      </Section>
    </Screen>
  );
}
