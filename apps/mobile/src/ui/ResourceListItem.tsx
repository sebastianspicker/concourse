import { Link } from "expo-router";
import React, { type ComponentProps, useCallback, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Card } from "./Card";
import { useTheme } from "./ThemeContext";
import { spacing } from "./theme";

export type ResourceListItemProps<T> = {
  item: T;
  href: (item: T) => { pathname: string; params: Record<string, string> };
  renderCard: (item: T) => { title: string; subtitle?: string };
  accessibilityLabel: (item: T) => string;
};

// SVG Chevron for 2026 native feel
const ChevronRight = ({ color }: { color: string }) => (
  <View style={styles.chevronContainer}>
    {/* Minimalistic Chevron Implementation */}
    <View style={[styles.chevronLine, styles.chevronTop, { backgroundColor: color }]} />
    <View style={[styles.chevronLine, styles.chevronBottom, { backgroundColor: color }]} />
  </View>
);

function ResourceListItemInner<T>({
  item,
  href,
  renderCard,
  accessibilityLabel
}: ResourceListItemProps<T>): JSX.Element {
  const card = renderCard(item);
  const linkHref = href(item);
  const label = accessibilityLabel(item);
  const theme = useTheme();
  const navigatingRef = useRef(false);

  // Reanimated press scale and opacity effect for hyper-responsive tactile feedback
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.04 }],
    opacity: 1 - pressed.value * 0.3,
  }));

  const handlePressIn = () => {
    // Ultra-fast engagement
    pressed.value = withSpring(1, {
      damping: 15,
      stiffness: 450,
      mass: 0.5
    });
  };

  const handlePressOut = () => {
    // Smooth, luxurious release
    pressed.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
      mass: 0.8
    });
  };

  const handlePress = useCallback<NonNullable<ComponentProps<typeof Link>["onPress"]>>((e) => {
    if (navigatingRef.current) {
      e.preventDefault();
      return;
    }
    navigatingRef.current = true;
    setTimeout(() => { navigatingRef.current = false; }, 500);
  }, []);

  return (
    <Link href={linkHref} onPress={handlePress} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={label}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressableContainer}
      >
        <Animated.View style={[animatedStyle, styles.cardWrapper]}>
          <Card title={card.title} subtitle={card.subtitle} />
          {/* Chevron overlay to indicate it's navigatable */}
          <View style={styles.chevronOverlay}>
            <ChevronRight color={theme.colors.muted} />
          </View>
        </Animated.View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressableContainer: {
    width: "100%",
  },
  cardWrapper: {
    width: "100%",
  },
  chevronOverlay: {
    position: "absolute",
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  chevronContainer: {
    width: 8,
    height: 14,
    justifyContent: "center",
    opacity: 0.6, // 2026: Subdued iconography, letting typography shine
  },
  chevronLine: {
    width: 1.5, // Thinner, precise
    height: 8.5,
    borderRadius: 1,
    position: "absolute",
  },
  chevronTop: {
    top: 0.5,
    transform: [{ rotate: "-45deg" }],
  },
  chevronBottom: {
    bottom: 0.5,
    transform: [{ rotate: "45deg" }],
  },
});

export const ResourceListItem = React.memo(
  ResourceListItemInner
) as typeof ResourceListItemInner;
