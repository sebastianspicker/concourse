import React from "react";
import { Button, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/ui/Screen";
import { Section } from "@/ui/Section";
import { typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";

export default function LoginScreen(): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <Screen>
      <Section title="Login">
        <Text
          style={[
            styles.note,
            {
              color: theme.colors.text,
              fontSize: Math.round(typography.body.fontSize * ui.fontScale),
              lineHeight: Math.round(typography.body.lineHeight * ui.fontScale),
            },
          ]}
        >
          This public template does not include real authentication. Private auth
          belongs in a private repo.
        </Text>
        <Button
          title="Continue as Guest"
          onPress={() => router.replace("/(tabs)")}
          accessibilityLabel="Continue as Guest"
        />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {
    ...typography.body,
  }
});
