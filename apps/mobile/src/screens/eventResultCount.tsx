import React from "react";
import { StyleSheet, Text } from "react-native";
import { typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";

const styles = StyleSheet.create({
  resultCount: {
    ...typography.caption,
    flex: 1,
  },
});

export function EventResultCount({
  loading,
  resultCount,
  search
}: {
  loading: boolean;
  resultCount: number;
  search: string;
}): JSX.Element | null {
  const theme = useTheme();
  if (loading) return null;
  return (
    <Text style={[styles.resultCount, { color: theme.colors.muted }]}>
      {resultCount} {resultCount === 1 ? "event" : "events"}
      {search ? ` for "${search}"` : ""}
    </Text>
  );
}
