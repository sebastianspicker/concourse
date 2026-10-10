/** Today's opening: the date and campus clock, then Now as an orange block and Next as a color card. */
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ScheduleItem } from "@concourse/contracts";
import { useLocale } from "@/localization/LocaleContext";
import { ArrowCircle } from "@/design-system/ArrowCircle";
import { useTheme } from "@/design-system/ThemeProvider";
import { selectedScheduleDetails, type DetailSource } from "@/data/public/selectedDetailRecords";
import { ClockBlock } from "./ClockBlock";
import { styles } from "./SignalStage.styles";
import { getBoardPresentation, type BoardScheduleState, type BoardSlot } from "./todaySourceStatus";
import { getScheduleHref } from "./todayScreenHelpers";

type SlotKind = "now" | "next";

type SlotColors = { fill: string; ink: string; soft: string };

/** Now is the flat orange block, Next the institution-color card; an empty slot is a grey block. */
function useSlotColors(kind: SlotKind, empty: boolean): SlotColors {
  const { colors } = useTheme();
  if (empty) return { fill: colors.surface, ink: colors.text, soft: colors.muted };
  if (kind === "now") return { fill: colors.signal, ink: colors.signalText, soft: colors.signalText };
  return { fill: colors.brand, ink: colors.brandText, soft: colors.brandText };
}

function SlotBody({ kind, slot, label, isWide, hovered }: { kind: SlotKind; slot: BoardSlot; label: string; isWide: boolean; hovered: boolean }): JSX.Element {
  const { ink, soft } = useSlotColors(kind, slot.empty);
  const lead = kind === "now" && !slot.empty;
  return (
    <View style={styles.slotCopy}>
      <Text style={[styles.slotLabel, { color: ink }]}>{label}</Text>
      <View style={styles.slotMain}>
        <Text
          numberOfLines={lead ? 2 : 3}
          style={[lead ? [styles.leadTitle, !isWide && styles.leadTitleCompact] : styles.nextTitle, { color: ink }, hovered && styles.hovered]}
        >
          {slot.title}
        </Text>
        {slot.meta ? <Text style={[styles.slotMeta, { color: soft }]}>{slot.meta}</Text> : null}
        {slot.note ? <Text style={[styles.slotNote, { color: soft }]}>{slot.note}</Text> : null}
      </View>
      {slot.item ? <ArrowCircle color={ink} /> : null}
    </View>
  );
}

/** One block of the opening. Blocks that name a real entry link to its detail view. */
function BoardLine({
  kind,
  slot,
  label,
  isWide,
  source,
}: {
  kind: SlotKind;
  slot: BoardSlot;
  label: string;
  isWide: boolean;
  source: DetailSource;
}): JSX.Element {
  const { fill } = useSlotColors(kind, slot.empty);
  // Flat object: Link asChild forwards the style to the anchor unchanged.
  const frame = StyleSheet.flatten([
    styles.slot,
    { backgroundColor: fill },
    isWide && (kind === "now" ? styles.nowWide : styles.nextWide),
  ]);
  const item: ScheduleItem | undefined = slot.item;
  if (!item) {
    return <View style={frame}><SlotBody kind={kind} slot={slot} label={label} isWide={isWide} hovered={false} /></View>;
  }
  return (
    <Link href={getScheduleHref(item)} asChild onPress={() => selectedScheduleDetails.remember(item, { authoritative: source === "network" })}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${label}: ${slot.title}. ${slot.meta ?? ""}`}
        testID={`today-board-${kind}`}
        style={frame}
      >
        {(state) => (
          <View style={[styles.fill, state.pressed && styles.slotPressed]}>
            <SlotBody kind={kind} slot={slot} label={label} isWide={isWide} hovered={(state as { hovered?: boolean }).hovered === true} />
          </View>
        )}
      </Pressable>
    </Link>
  );
}

function NowNextBoard({
  isWide,
  presentation,
  source,
}: {
  isWide: boolean;
  presentation: ReturnType<typeof getBoardPresentation>;
  source: DetailSource;
}): JSX.Element {
  const { t } = useLocale();
  return (
    <View testID="today-signal-board" style={[styles.board, isWide && styles.boardWide]}>
      <BoardLine kind="now" slot={presentation.now} label={t("now")} isWide={isWide} source={source} />
      {presentation.next ? (
        <BoardLine kind="next" slot={presentation.next} label={t("next")} isWide={isWide} source={source} />
      ) : null}
    </View>
  );
}

export function SignalStage({
  date,
  localTime,
  current,
  next,
  schedule,
  scheduleSource,
  locale,
  timeZone,
  isWide,
}: {
  date: string;
  localTime: string;
  current: ScheduleItem | undefined;
  next: ScheduleItem | undefined;
  schedule: BoardScheduleState;
  scheduleSource: DetailSource;
  locale: string;
  timeZone: string;
  isWide: boolean;
}): JSX.Element {
  const { t } = useLocale();
  const presentation = getBoardPresentation({ current, next, schedule, locale, timeZone, translate: t });

  return (
    <View style={[styles.stage, isWide && styles.stageWide]}>
      <ClockBlock
        date={date}
        localTime={localTime}
        isWide={isWide}
        timeZone={timeZone}
        campusLocalLabel={t("campusLocalTime")}
      />
      <NowNextBoard isWide={isWide} presentation={presentation} source={scheduleSource} />
    </View>
  );
}
