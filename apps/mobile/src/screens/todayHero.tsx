import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getFormattedDate, getGreeting } from "@/screens/todayScreenHelpers";
import { StatPill } from "@/screens/todayStatPill";
import { scaledFont, spacing, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";

const styles = StyleSheet.create({
  heroContainer: {
    marginBottom: spacing.sm,
  },
  greeting: {
    ...typography.heading,
  },
  dateText: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});

export function TodayHero({
  loading,
  eventCount,
  scheduleCount,
  showScheduleSection
}: {
  loading: boolean;
  eventCount: number;
  scheduleCount: number;
  showScheduleSection: boolean;
}): JSX.Element {
  const theme = useTheme();
  const ui = theme.ui;

  return (
    <View style={styles.heroContainer}>
      <Text
        style={[
          styles.greeting,
          {
            color: theme.colors.text,
            fontSize: scaledFont(typography.heading.fontSize, ui),
            lineHeight: scaledFont(typography.heading.lineHeight, ui),
          },
        ]}
      >
        {getGreeting()} 👋
      </Text>
      <Text
        style={[
          styles.dateText,
          {
            color: theme.colors.muted,
            fontSize: scaledFont(typography.body.fontSize, ui),
            lineHeight: scaledFont(typography.body.lineHeight, ui),
          },
        ]}
      >
        {getFormattedDate()}
      </Text>
      {!loading ? (
        <View style={styles.statsRow}>
          <StatPill count={eventCount} singular="event" plural="events" color={theme.colors.accent} />
          {showScheduleSection ? (
            <StatPill count={scheduleCount} singular="class" plural="classes" color={theme.colors.info} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
