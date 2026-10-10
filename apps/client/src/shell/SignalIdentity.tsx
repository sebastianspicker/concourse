/** Institution identity: the name as a heavy uppercase wordmark, with a round back control on detail views. */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation, useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getInstitutionDisplayName } from "@/platform/env/institution";
import { useLocale } from "@/localization/LocaleContext";
import { spacing, typography } from "@/design-system/theme";
import { useTheme } from "@/design-system/ThemeProvider";

export type SignalIdentityProps = {
  backFallback?: Href;
  compact?: boolean;
};

export function SignalIdentity({ backFallback, compact = false }: SignalIdentityProps): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const navigation = useNavigation();
  const router = useRouter();
  const institutionName = getInstitutionDisplayName();

  return (
    <View style={styles.row}>
      {backFallback ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("goBack")}
          testID="detail-back-control"
          onPress={() => (navigation.canGoBack() ? router.back() : router.replace(backFallback))}
          style={({ pressed }) => [styles.back, { borderColor: theme.colors.text }, pressed && styles.pressed]}
        >
          <MaterialIcons name="arrow-back" size={20} color={theme.colors.text} />
        </Pressable>
      ) : null}
      <View style={styles.identity} accessibilityRole="header">
        <Text
          testID="brand-institution"
          numberOfLines={1}
          style={[styles.institution, compact && styles.institutionCompact, { color: theme.colors.text }]}
        >
          {institutionName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minWidth: 0, flexShrink: 1 },
  identity: { minWidth: 0, flexShrink: 1 },
  institution: { ...typography.wordmark, flexShrink: 1 },
  institutionCompact: { fontSize: 16, lineHeight: 20 },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  pressed: { opacity: 0.64 },
});
