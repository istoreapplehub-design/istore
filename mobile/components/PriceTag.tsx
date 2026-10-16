import React from "react";
import { StyleSheet, Text, View, TextStyle } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

interface PriceTagProps {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg";
}

export function PriceTag({ price, compareAt, size = "md" }: PriceTagProps) {
  const formattedPrice = `₵${(price || 0).toLocaleString("en-GH", {
    maximumFractionDigits: 0
  })}`;

  const hasDiscount = Boolean(compareAt && compareAt > price);
  const savings = hasDiscount && compareAt ? compareAt - price : 0;
  const formattedSavings = `SAVE ₵${savings.toLocaleString("en-GH", {
    maximumFractionDigits: 0
  })}`;
  const formattedOldPrice = compareAt
    ? `₵${compareAt.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`
    : "";

  const sizeStyle: TextStyle =
    size === "lg"
      ? styles.priceLg
      : size === "sm"
      ? styles.priceSm
      : styles.priceMd;

  const oldPriceStyle: TextStyle =
    size === "lg"
      ? styles.oldPriceLg
      : size === "sm"
      ? styles.oldPriceSm
      : styles.oldPriceMd;

  return (
    <View style={styles.container}>
      <Text style={[styles.priceText, sizeStyle]}>{formattedPrice}</Text>

      {hasDiscount && (
        <>
          <Text style={[styles.oldPriceText, oldPriceStyle]}>
            {formattedOldPrice}
          </Text>
          <View style={styles.savePill}>
            <Text style={styles.saveText}>{formattedSavings}</Text>
          </View>
        </>
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
  priceText: {
    color: colors.accent
  },
  priceSm: {
    fontSize: 13,
    fontWeight: "500"
  },
  priceMd: {
    fontSize: 16,
    fontWeight: "600"
  },
  priceLg: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5
  },
  oldPriceText: {
    color: colors.textSecondary,
    textDecorationLine: "line-through"
  },
  oldPriceSm: {
    fontSize: 11,
    fontWeight: "400"
  },
  oldPriceMd: {
    fontSize: 13,
    fontWeight: "400"
  },
  oldPriceLg: {
    fontSize: 18,
    fontWeight: "400"
  },
  savePill: {
    backgroundColor: colors.brandRed,
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 2,
    borderRadius: radius.pill
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3
  }
});

export default PriceTag;
