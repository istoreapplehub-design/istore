import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/theme";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
}

export function StarRating({
  rating,
  size = 14,
  showValue = false,
  reviewCount
}: StarRatingProps) {
  const normalized = Math.max(0, Math.min(5, rating || 0));

  const stars: Array<keyof typeof Ionicons.glyphMap> = [];
  for (let i = 1; i <= 5; i++) {
    if (normalized >= i) {
      stars.push("star");
    } else if (normalized >= i - 0.5) {
      stars.push("star-half");
    } else {
      stars.push("star-outline");
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {stars.map((iconName, index) => (
          <Ionicons
            key={index}
            name={iconName}
            size={size}
            color={colors.star}
            style={styles.starIcon}
          />
        ))}
      </View>

      {showValue && (
        <Text style={[styles.ratingValue, { fontSize: size }]}>
          {normalized.toFixed(1)}
        </Text>
      )}

      {reviewCount !== undefined && (
        <Text style={[styles.reviewCount, { fontSize: Math.max(10, size - 2) }]}>
          ({reviewCount})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  starIcon: {
    marginRight: 2
  },
  ratingValue: {
    color: colors.text,
    fontWeight: "600"
  },
  reviewCount: {
    color: colors.textSecondary,
    fontWeight: "400"
  }
});
