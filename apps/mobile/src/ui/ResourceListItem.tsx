/** Renders accessible resource-ledger links with standard and time-column variants. */
import { Link } from "expo-router";
import React, { type ComponentProps, useCallback, useRef } from "react";
import { Pressable } from "react-native";
import { useLocale } from "../i18n/LocaleContext";
import { getDesignPreset } from "./designPresets";
import { ResourceListRow } from "./ResourceListRow";
import { styles } from "./ResourceListItem.styles";
import type { ResourceListItemProps } from "./ResourceListItem.types";
import { useTheme } from "./ThemeContext";

export type {
  ResourceListContent,
  ResourceListItemProps,
  ResourceListItemVariant,
} from "./ResourceListItem.types";

function ResourceListItemInner<T>({
  item,
  href,
  renderCard,
  accessibilityLabel,
  onNavigate,
  variant = "standard",
  active = false,
  isFirst = false,
  isLast: _isLast = false,
  minHeight,
  open = false,
}: ResourceListItemProps<T>): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const metrics = getDesignPreset(theme.designPreset).metrics;
  const content = renderCard(item);
  const navigating = useRef(false);
  const handlePress = useCallback<NonNullable<ComponentProps<typeof Link>["onPress"]>>((event) => {
    if (navigating.current) {
      event.preventDefault();
      return;
    }
    navigating.current = true;
    onNavigate?.(item);
    setTimeout(() => { navigating.current = false; }, 500);
  }, [item, onNavigate]);

  return (
    <Link href={href(item)} onPress={handlePress} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={accessibilityLabel(item)}
        style={styles.link}
      >
        {({ pressed }) => (
          <ResourceListRow
            content={content}
            variant={variant}
            active={active}
            isFirst={isFirst}
            pressed={pressed}
            theme={theme}
            minHeight={minHeight ?? metrics.rowMinHeight}
            open={open}
            defaultNextBadge={t("nextUp")}
          />
        )}
      </Pressable>
    </Link>
  );
}

export const ResourceListItem = React.memo(ResourceListItemInner) as typeof ResourceListItemInner;
