/** Renders searchable campus rooms with accessible result cards. */
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Room } from "@concourse/contracts";
import { SearchBar } from "@/design-system/SearchBar";
import { SignalPageHeader } from "@/shell/SignalPageHeader";
import { useRooms } from "@/data/public/useRooms";
import { useLocale } from "@/localization/LocaleContext";
import { getRoomAccessibilityLabel, getRoomCard, getRoomHref, getRoomsEmptyHint, getRoomsEmptyMessage } from "@/features/rooms/roomsScreenHelpers";
import { ResourceList } from "@/design-system/ResourceList";
import { Screen } from "@/design-system/Screen";
import { StatusBanner } from "@/design-system/StatusBanner";
import { spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeContext";
import { selectedRoomDetails } from "@/data/public/selectedDetailRecords";

/** Presents searchable campus rooms and route-aware resource selection. */
export default function RoomsScreen(): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const state = useRooms({ search: search || undefined });
  const rooms = state.data?.rooms ?? [];
  const keyExtractor = useCallback((item: Room) => item.id, []);
  const href = useCallback((item: Room) => getRoomHref(item), []);
  const renderCard = useCallback((item: Room) => getRoomCard(item), []);
  const accessibilityLabel = useCallback((item: Room) => getRoomAccessibilityLabel(item, t("campus")), [t]);
  const onNavigate = useCallback((item: Room) => {
    selectedRoomDetails.remember(item, { authoritative: state.source === "network" });
  }, [state.source]);

  const header = (
    <View style={styles.header}>
      <SignalPageHeader title={t("rooms")} />
      <SearchBar value={search} onChangeText={setSearch} label={t("searchRooms")} placeholder={t("searchRooms")} testID="rooms-search" />
      {!state.loading ? <Text accessibilityLiveRegion="polite" style={[styles.count, { color: theme.colors.muted }]}>{t(rooms.length === 1 ? "roomResultCountOne" : "roomResultCountOther", { count: rooms.length })}</Text> : null}
      {state.source === "persisted-cache" ? <StatusBanner kind="cached" cacheAge={state.cacheAge} /> : null}
    </View>
  );

  return (
    <Screen scroll={false} maxWidth={1400} testID="rooms-screen">
      <ResourceList
        testID="rooms-list"
        header={header}
        items={rooms}
        loading={state.loading}
        error={state.error}
        refreshing={state.refreshing}
        onRefresh={() => void state.refresh()}
        emptyMessage={search ? getRoomsEmptyMessage(search, t) : t("noRooms")}
        emptyHint={getRoomsEmptyHint(search, t)}
        keyExtractor={keyExtractor}
        href={href}
        renderCard={renderCard}
        accessibilityLabel={accessibilityLabel}
        onNavigate={onNavigate}
        variant="route"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { gap: spacing.xl, paddingBottom: spacing.xl }, count: { ...typography.caption } });
