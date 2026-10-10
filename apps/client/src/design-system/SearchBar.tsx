/** Provides an accessible, clearable search input with keyboard-safe focus handling. */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocale } from "@/localization/LocaleContext";
import { spacing, typography } from "./theme";
import { useTheme, useDesignMetrics } from "./ThemeProvider";

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  debounceMs?: number;
  testID?: string;
};

/** Renders the accessible query field and forwards each typed filter value. */
export function SearchBar({
  value,
  onChangeText,
  label,
  placeholder,
  debounceMs = 250,
  testID,
}: SearchBarProps): JSX.Element {
  const theme = useTheme();
  const { t } = useLocale();
  const metrics = useDesignMetrics();
  const [localValue, setLocalValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleLabel = label ?? placeholder ?? t("search");

  useEffect(() => setLocalValue(value), [value]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const update = useCallback((next: string) => {
    setLocalValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChangeText(next), debounceMs);
  }, [debounceMs, onChangeText]);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.muted }]}>{visibleLabel}</Text>
      <View
        style={[
          styles.control,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: metrics.controlRadius,
          },
        ]}
        accessibilityRole="search"
      >
        <MaterialIcons name="search" size={22} color={theme.colors.text} />
        <TextInput
          testID={testID}
          style={[styles.input, { color: theme.colors.text }]}
          value={localValue}
          onChangeText={update}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          accessibilityLabel={visibleLabel}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {localValue.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("clearSearch")}
            hitSlop={8}
            onPress={() => update("")}
            style={styles.clear}
            testID={testID ? `${testID}-clear` : undefined}
          >
            <MaterialIcons name="close" size={22} color={theme.colors.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { ...typography.label },
  control: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingLeft: spacing.md },
  input: { ...typography.body, fontSize: 19, flex: 1, minWidth: 0, paddingVertical: spacing.sm },
  clear: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
});
