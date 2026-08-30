import { Text, View } from "react-native";
import { useLocale } from "@/localization/LocaleContext";
import { useTheme } from "@/design-system/ThemeContext";
import { styles } from "./SignalBoard.styles";

function SignalPanel({
  isWide,
  label,
  title,
  meta,
  inverse,
}: {
  isWide: boolean;
  label: string;
  title: string;
  meta: string | null;
  inverse: boolean;
}): JSX.Element {
  const theme = useTheme();
  const textColor = inverse ? theme.colors.inverseText : theme.colors.signalText;
  return (
    <View
      style={[
        inverse ? styles.nextPanel : styles.nowPanel,
        isWide && styles.panelWide,
        { backgroundColor: inverse ? theme.colors.inverseSurface : theme.colors.signal },
      ]}
    >
      <Text style={[styles.signalLabel, { color: textColor }]}>{label}</Text>
      <View style={styles.panelBody}>
        {inverse ? (
          <Text numberOfLines={2} style={[styles.signalTitle, { color: textColor }]}>
            {title}
          </Text>
        ) : (
          <Text style={[styles.signalTitle, { color: textColor }]}>{title}</Text>
        )}
        {meta ? (
          <Text style={[styles.signalMeta, inverse && styles.nextMeta, { color: textColor }]}>
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

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
      <SignalPanel
        isWide={isWide}
        label={t("now")}
        title={nowTitle}
        meta={sourceLabel}
        inverse={false}
      />

      <SignalPanel
        isWide={isWide}
        label={t("next")}
        title={nextTitle}
        meta={nextMeta}
        inverse
      />
    </View>
  );
}
