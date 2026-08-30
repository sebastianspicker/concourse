import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, View } from "react-native";
import { ResourceListCopy } from "./ResourceListCopy";
import { styles } from "./ResourceListItem.styles";
import type { ResourceListContent, ResourceListItemVariant } from "./ResourceListItem.types";
import { getResourceRowBackground } from "./resourceRowBackground";
import { TimelineSpineDot } from "./TimelineSpineDot";
import type { useTheme } from "./ThemeContext";

export function ResourceListRow({
  content,
  variant,
  active,
  isFirst,
  pressed,
  theme,
  minHeight,
  open,
  defaultNextBadge,
}: {
  content: ResourceListContent;
  variant: ResourceListItemVariant;
  active: boolean;
  isFirst: boolean;
  pressed: boolean;
  theme: ReturnType<typeof useTheme>;
  minHeight: number;
  open: boolean;
  defaultNextBadge: string;
}): JSX.Element {
  const timeline = variant === "timeline";
  const badgeText = content.badge ?? (timeline && active ? defaultNextBadge : undefined);
  return (
    <View
      testID="resource-row"
      style={[
        styles.row,
        styles.rowDivider,
        {
          minHeight,
          borderColor: theme.colors.border,
          borderTopWidth: isFirst ? theme.ui.borderWidth : 0,
          borderBottomWidth: theme.ui.borderWidth,
          backgroundColor: getResourceRowBackground(theme, pressed, active, open, timeline),
        },
      ]}
    >
      {timeline ? (
        <View testID="resource-timeline-time" style={styles.timelineTimeColumn}>
          <Text numberOfLines={2} style={[styles.timelineTime, { color: theme.colors.text }]}>
            {content.leading}
          </Text>
        </View>
      ) : null}
      {timeline ? <TimelineSpineDot active={active} theme={theme} /> : null}
      <ResourceListCopy content={content} badgeText={badgeText} theme={theme} />
      <MaterialIcons
        testID="resource-row-chevron"
        name="chevron-right"
        size={24}
        color={theme.colors.muted}
      />
    </View>
  );
}
