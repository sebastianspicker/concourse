import { View } from "react-native";
import type { useSchedule } from "@/hooks/useSchedule";
import type { useToday } from "@/hooks/useToday";
import { ScheduleSection } from "@/screens/todayScheduleSection";
import { TodayEventsSection } from "@/screens/todayEventsSection";
import type { SortDirection } from "@/screens/todayScreenHelpers";
import { styles } from "./TodayAgenda.styles";
import { ScheduleLimitNotice } from "./TodayStateNotices";
import type { getTodaySchedule } from "./todaySchedule";

export function TodayAgenda({
  isWide,
  borderColor,
  scheduleUnavailable,
  schedule,
  scheduleState,
  todayState,
  sortDirection,
  onToggleSort,
}: {
  isWide: boolean;
  borderColor: string;
  scheduleUnavailable: boolean;
  schedule: ReturnType<typeof getTodaySchedule>;
  scheduleState: ReturnType<typeof useSchedule>;
  todayState: ReturnType<typeof useToday>;
  sortDirection: SortDirection;
  onToggleSort: () => void;
}): JSX.Element {
  return (
    <View style={[styles.agenda, isWide && styles.agendaWide]}>
      {!scheduleUnavailable ? (
        <View
          style={[
            styles.agendaColumn,
            isWide && styles.scheduleColumn,
            isWide && { borderRightColor: borderColor },
          ]}
        >
          <ScheduleSection
            sortDirection={sortDirection}
            onToggleSort={onToggleSort}
            loading={scheduleState.loading}
            error={scheduleState.error}
            items={schedule.items}
            source={scheduleState.source}
            isWide={isWide}
            onRetry={() => void scheduleState.refresh()}
          />
          <ScheduleLimitNotice count={schedule.items.length} total={schedule.total} />
        </View>
      ) : null}
      <View style={[styles.agendaColumn, isWide && styles.eventsColumn]}>
        <TodayEventsSection
          loading={todayState.loading}
          error={todayState.error}
          events={todayState.data?.events ?? []}
          source={todayState.source}
          isWide={isWide}
          onRetry={() => void todayState.refresh()}
        />
      </View>
    </View>
  );
}
