import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from "react-native-reanimated";
import { colors } from "../../constants/theme";

type IoniconsName = keyof typeof Ionicons.glyphMap;

export interface StatCardProps {
  label: string;
  value: string;
  icon: IoniconsName;
  color?: string;
  trend?: { value: number; positive: boolean };
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StatCard({
  label,
  value,
  icon,
  color = colors.accent,
  trend,
  onPress
}: StatCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.selectionAsync();
      onPress();
    }
  };

  return (
    <AnimatedPressable
      disabled={!onPress}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${color}26` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>

      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>

      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>

      {trend && (
        <View
          style={[
            styles.trendPill,
            {
              backgroundColor: trend.positive
                ? "rgba(23, 23, 23, 0.1)"
                : "rgba(23, 23, 23, 0.1)"
            }
          ]}
        >
          <Text
            style={[
              styles.trendText,
              { color: trend.positive ? colors.success : colors.danger }
            ]}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}%
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
    fontWeight: "500"
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: colors.text,
    marginTop: 4
  },
  trendPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600"
  }
});

export default StatCard;
