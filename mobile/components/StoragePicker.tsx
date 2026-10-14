import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, radius, spacing } from "../constants/theme";

interface StoragePickerProps {
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StoragePill({
  value,
  isSelected,
  onPress
}: {
  value: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 250 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 250 });
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <AnimatedPressable
      style={[
        styles.pill,
        isSelected ? styles.pillSelected : styles.pillUnselected,
        animatedStyle
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Text
        style={[
          styles.pillText,
          isSelected ? styles.pillTextSelected : styles.pillTextUnselected
        ]}
      >
        {value}
      </Text>
    </AnimatedPressable>
  );
}

export function StoragePicker({
  options,
  selected,
  onSelect
}: StoragePickerProps) {
  if (!options || options.length === 0) {
    return null;
  }

  const selectedValue = selected || options[0];

  return (
    <View style={styles.container}>
      {options.map((opt) => (
        <StoragePill
          key={opt}
          value={opt}
          isSelected={opt === selectedValue}
          onPress={() => onSelect(opt)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  pill: {
    paddingHorizontal: spacing.lg - 4,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center"
  },
  pillSelected: {
    borderColor: colors.accent,
    backgroundColor: "rgba(23, 23, 23, 0.08)"
  },
  pillUnselected: {
    borderColor: colors.border,
    backgroundColor: "transparent"
  },
  pillText: {
    fontSize: 15
  },
  pillTextSelected: {
    color: colors.accent,
    fontWeight: "600"
  },
  pillTextUnselected: {
    color: colors.text,
    fontWeight: "500"
  }
});
