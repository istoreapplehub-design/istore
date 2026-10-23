import React from "react";
import { StyleSheet, Text, View, Image, ViewStyle, StyleProp } from "react-native";
import { colors } from "../constants/theme";

interface BrandLogoProps {
  size?: number;
  variant?: "dark" | "light" | "minimal";
  showWordmark?: boolean;
  wordmarkSize?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * LesTrades Official Brand Logo & Monogram.
 * Features the signature 3D folded blue ribbon emblem and italic wordmark.
 */
export function BrandLogo({
  size = 38,
  variant = "light",
  showWordmark = false,
  wordmarkSize = 18,
  style
}: BrandLogoProps) {
  const borderRadius = Math.round(size * 0.24);

  const badge = (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "rgba(4, 101, 179, 0.14)"
        },
        !showWordmark && style
      ]}
    >
      <Image
        source={require("../assets/images/lestrades-emblem.png")}
        style={{ width: Math.round(size * 0.88), height: Math.round(size * 0.88) }}
        resizeMode="contain"
      />
    </View>
  );

  if (!showWordmark) {
    return badge;
  }

  return (
    <View style={[styles.wordmarkRow, style]}>
      {badge}
      <View style={styles.textCol}>
        <Text style={[styles.wordmarkText, { fontSize: wordmarkSize }]}>
          LesTrades
        </Text>
        <Text style={[styles.taglineText, { fontSize: Math.max(9, Math.round(wordmarkSize * 0.52)) }]}>
          Quality for Less
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  textCol: {
    justifyContent: "center"
  },
  wordmarkText: {
    fontStyle: "italic",
    fontWeight: "800",
    color: "#0465B3",
    letterSpacing: -0.6
  },
  taglineText: {
    fontStyle: "italic",
    fontWeight: "600",
    color: "#0465B3",
    letterSpacing: 0.1,
    marginTop: -1
  }
});

export default BrandLogo;
