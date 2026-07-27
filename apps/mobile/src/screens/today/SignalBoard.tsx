/** Amber Now + inverse Next dual chamber for the Quiet Chronograph stage. */
import { StyleSheet, Text, View } from "react-native";
import { useLocale } from "@/i18n/LocaleContext";
import { spacing, typography } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";

/** Amber Now + inverse Next dual chamber. */
export function SignalBoard({
  isWide,
  nowTitle,
  sourceLabel,
  nextTitle,
  nextMeta,
}: {
  isWide: boolean;
  nowTitle: string;
  sourceLabel: string;
  nextTitle: string;
  nextMeta: string | null;
}): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  return (
    <View
      testID="today-signal-board"
      style={[
        styles.signalBoard,
        isWide && styles.signalBoardWide,
        { borderColor: theme.colors.border },
      ]}
    >
      <View
        style={[
          styles.nowPanel,
          isWide && styles.panelWide,
          { backgroundColor: theme.colors.signal },
        ]}
      >
        <Text style={[styles.signalLabel, { color: theme.colors.signalText }]}>{t("now")}</Text>
        <View style={styles.panelBody}>
          <Text style={[styles.signalTitle, { color: theme.colors.signalText }]}>{nowTitle}</Text>
          <Text style={[styles.signalMeta, { color: theme.colors.signalText }]}>{sourceLabel}</Text>
        </View>
      </View>

      <View
        style={[
          styles.nextPanel,
          isWide && styles.panelWide,
          { backgroundColor: theme.colors.inverseSurface },
        ]}
      >
        <Text style={[styles.signalLabel, { color: theme.colors.inverseText }]}>{t("next")}</Text>
        <View style={styles.panelBody}>
          <Text numberOfLines={2} style={[styles.signalTitle, { color: theme.colors.inverseText }]}>
            {nextTitle}
          </Text>
          {nextMeta ? (
            <Text style={[styles.signalMeta, styles.nextMeta, { color: theme.colors.inverseText }]}>
              {nextMeta}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  signalBoard: {
    minHeight: 164,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  signalBoardWide: {
    flex: 1,
    flexDirection: "row",
    minHeight: 168,
  },
  nowPanel: {
    minHeight: 150,
    padding: spacing.xl,
    justifyContent: "space-between",
    gap: spacing.md,
  },
  nextPanel: {
    minHeight: 150,
    padding: spacing.xl,
    justifyContent: "space-between",
    gap: spacing.md,
  },
  panelWide: {
    flex: 1,
    minHeight: 168,
  },
  panelBody: {
    gap: spacing.xs,
  },
  signalLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    opacity: 0.85,
  },
  signalTitle: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.6,
    fontWeight: "600",
  },
  signalMeta: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.88,
  },
  nextMeta: {
    opacity: 0.72,
  },
});
