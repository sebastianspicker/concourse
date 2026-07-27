/** Institution + product identity for Quiet Chronograph chrome, with optional detail back. */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation, useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getInstitutionDisplayName } from "@/config/institution";
import { useLocale } from "@/i18n/LocaleContext";
import { spacing } from "@/ui/theme";
import { useTheme } from "@/ui/ThemeContext";

export type SignalIdentityProps = {
  backFallback?: Href;
  /** Stack institution above product on compact widths (phone mockup). */
  compact?: boolean;
};

/** Renders back control (when needed) plus sentence-case institution and accent product name. */
export function SignalIdentity({ backFallback, compact = false }: SignalIdentityProps): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const navigation = useNavigation();
  const router = useRouter();

  return (
    <View style={styles.row}>
      {backFallback ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("goBack")}
          testID="detail-back-control"
          onPress={() => (navigation.canGoBack() ? router.back() : router.replace(backFallback))}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <MaterialIcons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
      ) : null}
      <View style={[styles.identity, compact && styles.identityCompact]} accessibilityRole="header">
        <Text
          testID="brand-institution"
          numberOfLines={1}
          style={[styles.institution, { color: theme.colors.text }]}
        >
          {getInstitutionDisplayName()}
        </Text>
        <Text testID="brand-product" style={[styles.product, { color: theme.colors.accent }]}>
          Concourse
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    flexShrink: 1,
  },
  identity: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 14,
    minWidth: 0,
    flexShrink: 1,
  },
  identityCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  institution: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    letterSpacing: -0.14,
    flexShrink: 1,
  },
  product: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "500",
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  pressed: { opacity: 0.64 },
});
