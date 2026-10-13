import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../constants/theme";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SectionHeader({ title, subtitle, onSeeAll }: SectionHeaderProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (onSeeAll) {
      Haptics.selectionAsync();
      onSeeAll();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {onSeeAll && (
        <AnimatedPressable
          style={[styles.seeAllButton, animatedStyle]}
          hitSlop={12}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.accent}
            style={styles.chevron}
          />
        </AnimatedPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: spacing.md,
    paddingBottom: spacing.sm + 4,
    paddingHorizontal: spacing.md
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: colors.text
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: "400"
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center"
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.accent
  },
  chevron: {
    marginLeft: 2
  }
});
