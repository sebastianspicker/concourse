import { Text, View } from "react-native";
import { styles } from "./ResourceListItem.styles";
import type { ResourceListContent } from "./ResourceListItem.types";
import { withOpacity } from "./theme";
import type { useTheme } from "./ThemeContext";

export function ResourceListCopy({
  content,
  badgeText,
  theme,
}: {
  content: ResourceListContent;
  badgeText: string | undefined;
  theme: ReturnType<typeof useTheme>;
}): JSX.Element {
  return (
    <View testID="resource-row-copy" style={styles.copy}>
      <Text numberOfLines={2} style={[styles.title, { color: theme.colors.text }]}>
        {content.title}
      </Text>
      {content.subtitle ? (
        <Text numberOfLines={2} style={[styles.subtitle, { color: theme.colors.muted }]}>
          {content.subtitle}
        </Text>
      ) : null}
      {badgeText ? (
        <Text
          testID="resource-row-badge"
          numberOfLines={1}
          style={[
            styles.badge,
            {
              color: theme.colors.signalText,
              backgroundColor: withOpacity(theme.colors.signal, 0.22),
            },
          ]}
        >
          {badgeText}
        </Text>
      ) : null}
    </View>
  );
}
