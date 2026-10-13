import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../constants/theme";

interface CategoryTileProps {
  name: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CategoryTile({ name, count, icon, onPress }: CategoryTileProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 120 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  const countText = count === 1 ? "1 item" : `${count} items`;

  return (
    <AnimatedPressable
      style={[styles.tile, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={32} color={colors.accent} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.nameText} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.countText}>{countText}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    justifyContent: "space-between"
  },
  iconContainer: {
    alignSelf: "flex-start"
  },
  textContainer: {
    marginTop: "auto"
  },
  nameText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  },
  countText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: "400"
  }
});
