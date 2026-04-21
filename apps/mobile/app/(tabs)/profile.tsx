import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getDemoSession } from "../../src/auth/session";
import { Screen } from "@/ui/Screen";
import { Section } from "@/ui/Section";
import { useTheme, useThemePreference, ThemePreference } from "@/ui/ThemeContext";
import { borderRadius, scaledFont, scaledRadius, scaled, typography, spacing, withOpacity } from "@/ui/theme";
import { a11yButton } from "@/ui/a11y";

export default function ProfileScreen(): JSX.Element {
  const session = getDemoSession();
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();
  const ui = theme.ui;

  const themeOptions: { label: string; value: ThemePreference; icon: string }[] = [
    { label: "Dark", value: "dark", icon: "🌙" },
    { label: "System", value: "system", icon: "⚙️" },
    { label: "Light", value: "light", icon: "☀️" },
    { label: "Accessible", value: "accessibility", icon: "♿" },
  ];

  const buttonPaddingHorizontal = Math.round(spacing.md * ui.controlScale);
  const buttonPaddingVertical = Math.round(spacing.sm * ui.controlScale);
  const buttonRadius = scaledRadius(borderRadius.lg, ui);
  const buttonFontSize = scaledFont(typography.caption.fontSize, ui);
  const buttonLineHeight = scaledFont(typography.caption.lineHeight, ui);

  const avatarSize = scaled(64, ui);
  const avatarRadius = avatarSize / 2;

  return (
    <Screen>
      <Section title="Profile">
        {/* Avatar + name card */}
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
          <View
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarRadius,
                backgroundColor: withOpacity(theme.colors.accent, 0.15),
              },
            ]}
          >
            <Text style={[styles.avatarText, { fontSize: scaled(28, ui) }]}>
              {session.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
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
        </View>
        {session.isDemo ? (
          <Text style={[styles.note, { color: theme.colors.muted }]}>
            Demo session -- connect your university auth to personalize.
          </Text>
        ) : null}
      </Section>

      <Section title="Appearance">
        <View style={styles.themeOptions}>
          {themeOptions.map((option) => {
            const isSelected = preference === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setPreference(option.value)}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.accent
                      : theme.colors.surface,
                    borderColor: isSelected
                      ? theme.colors.accent
                      : theme.colors.border,
                    borderWidth: isSelected ? ui.emphasisBorderWidth : ui.borderWidth,
                    borderRadius: buttonRadius,
                    paddingHorizontal: buttonPaddingHorizontal,
                    paddingVertical: buttonPaddingVertical,
                  },
                ]}
                {...a11yButton(
                  `${option.label} theme`,
                  isSelected
                    ? "Currently selected"
                    : `Select ${option.label.toLowerCase()} theme`
                )}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={styles.themeIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color: isSelected
                        ? theme.colors.accentText
                        : theme.colors.text,
                      fontSize: buttonFontSize,
                      lineHeight: buttonLineHeight,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderCurve: "continuous",
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "700",
  },
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
  themeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  themeIcon: {
    fontSize: 16,
  },
  themeButtonText: {
    ...typography.caption,
    fontWeight: "600",
  },
});
