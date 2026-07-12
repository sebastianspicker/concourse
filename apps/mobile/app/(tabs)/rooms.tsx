import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Room } from "@campus/shared";
import { SearchBar } from "@/components/SearchBar";
import { useRooms } from "@/hooks/useRooms";
import { useLocale } from "@/i18n/LocaleContext";
import { getRoomAccessibilityLabel, getRoomCard, getRoomHref, getRoomsEmptyHint, getRoomsEmptyMessage } from "@/screens/roomsScreenHelpers";
import { ResourceList } from "@/ui/ResourceList";
import { Screen } from "@/ui/Screen";
import { StatusBanner } from "@/ui/StatusBanner";
import { spacing, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";

export default function RoomsScreen(): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const state = useRooms({ search: search || undefined });
  const rooms = state.data?.rooms ?? [];
  const keyExtractor = useCallback((item: Room) => item.id, []);
  const href = useCallback((item: Room) => getRoomHref(item), []);
  const renderCard = useCallback((item: Room) => getRoomCard(item), []);
  const accessibilityLabel = useCallback((item: Room) => getRoomAccessibilityLabel(item), []);

  const header = (
    <View style={styles.header}>
      <SearchBar value={search} onChangeText={setSearch} label={t("searchRooms")} placeholder={t("searchRooms")} testID="rooms-search" />
      {!state.loading ? <Text style={[styles.count, { color: theme.colors.muted }]}>{rooms.length} {t("rooms").toLocaleLowerCase()}</Text> : null}
      {state.source === "persisted-cache" ? <StatusBanner kind="cached" cacheAge={state.cacheAge} /> : null}
    </View>
  );

  return (
    <Screen scroll={false} maxWidth={760} testID="rooms-screen">
      <ResourceList
        testID="rooms-list"
        header={header}
        items={rooms}
        loading={state.loading}
        error={state.error}
        refreshing={state.refreshing}
        onRefresh={() => void state.refresh()}
        emptyMessage={search ? getRoomsEmptyMessage(search) : t("noRooms")}
        emptyHint={getRoomsEmptyHint(search)}
        keyExtractor={keyExtractor}
        href={href}
        renderCard={renderCard}
        accessibilityLabel={accessibilityLabel}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { gap: spacing.md, paddingBottom: spacing.md }, count: { ...typography.caption } });
