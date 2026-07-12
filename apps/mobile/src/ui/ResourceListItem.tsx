import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link } from "expo-router";
import React, { type ComponentProps, useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "./theme";
import { useTheme } from "./ThemeContext";

export type ResourceListItemProps<T> = {
  item: T;
  href: (item: T) => { pathname: string; params: Record<string, string> };
  renderCard: (item: T) => { title: string; subtitle?: string };
  accessibilityLabel: (item: T) => string;
};

function ResourceListItemInner<T>({ item, href, renderCard, accessibilityLabel }: ResourceListItemProps<T>): JSX.Element {
  const theme = useTheme();
  const content = renderCard(item);
  const navigating = useRef(false);
  const handlePress = useCallback<NonNullable<ComponentProps<typeof Link>["onPress"]>>((event) => {
    if (navigating.current) {
      event.preventDefault();
      return;
    }
    navigating.current = true;
    setTimeout(() => { navigating.current = false; }, 500);
  }, []);

  return (
    <Link href={href(item)} onPress={handlePress} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={accessibilityLabel(item)}
        style={({ pressed }) => [styles.row, { borderBottomColor: theme.colors.border, backgroundColor: pressed ? theme.colors.infoSurface : theme.colors.surface }]}
      >
        <View style={styles.copy}>
          <Text numberOfLines={2} style={[styles.title, { color: theme.colors.text }]}>{content.title}</Text>
          {content.subtitle ? <Text numberOfLines={2} style={[styles.subtitle, { color: theme.colors.muted }]}>{content.subtitle}</Text> : null}
        </View>
        <MaterialIcons name="chevron-right" size={24} color={theme.colors.muted} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  copy: { flex: 1, minWidth: 0 },
  title: { ...typography.body, fontWeight: "600" },
  subtitle: { ...typography.caption, marginTop: 2 },
});

export const ResourceListItem = React.memo(ResourceListItemInner) as typeof ResourceListItemInner;
