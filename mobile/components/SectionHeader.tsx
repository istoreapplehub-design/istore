import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
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
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SectionHeader({ title, subtitle, onSeeAll, style }: SectionHeaderProps) {
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
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>{title}</Text>
        </View>
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
            color={colors.brandRed}
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  accentBar: {
    width: 3.5,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.brandRed
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
    marginLeft: 11.5,
    fontWeight: "400"
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center"
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.brandRed
  },
  chevron: {
    marginLeft: 2
  }
});
