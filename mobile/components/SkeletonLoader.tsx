import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle, DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from "react-native-reanimated";
import { colors, radius as themeRadius, spacing } from "../constants/theme";

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/**
 * Reanimated 3 Shimmer Skeleton Loader
 */
export function SkeletonLoader({
  width = "100%",
  height = 16,
  radius = themeRadius.sm,
  style
}: SkeletonLoaderProps) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, {
        duration: 1100,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  return (
    <View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: radius
        },
        style
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]} />
    </View>
  );
}

/**
 * Skeleton placeholder for standard 180px wide Apple product card
 */
export function SkeletonProductCard() {
  return (
    <View style={styles.cardContainer}>
      <SkeletonLoader width={180} height={180} radius={themeRadius.lg} />
      <View style={{ marginTop: spacing.sm }}>
        <SkeletonLoader width={140} height={16} radius={themeRadius.sm} />
      </View>
      <View style={{ marginTop: spacing.xs }}>
        <SkeletonLoader width={80} height={18} radius={themeRadius.sm} />
      </View>
    </View>
  );
}

/**
 * Skeleton row for search results or settings
 */
export function SkeletonRow() {
  return (
    <View style={styles.rowContainer}>
      <SkeletonLoader width={56} height={56} radius={themeRadius.md} />
      <View style={styles.rowContent}>
        <SkeletonLoader width="70%" height={16} radius={themeRadius.sm} />
        <View style={{ marginTop: spacing.xs }}>
          <SkeletonLoader width="45%" height={14} radius={themeRadius.sm} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for Hero Carousel
 */
export function SkeletonHeroBanner() {
  return (
    <View style={styles.heroContainer}>
      <SkeletonLoader width="100%" height={380} radius={themeRadius.lg} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
    overflow: "hidden"
  },
  shimmer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface
  },
  cardContainer: {
    width: 180,
    marginRight: spacing.md
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm
  },
  rowContent: {
    flex: 1,
    marginLeft: spacing.md
  },
  heroContainer: {
    width: "100%",
    paddingHorizontal: spacing.md,
    marginVertical: spacing.md
  }
});

export default SkeletonLoader;

