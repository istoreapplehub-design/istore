/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on card tap
 */
import React from "react";
import { Image, Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, formatGHS, radius } from "../constants/theme";
import { Product } from "../types";
import { amountSaved, discountPercent } from "../hooks/useFlashDeals";
import { getProductImage, ProductVisual } from "./ProductVisual";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FlashDealCardProps {
  product: Product;
  /** "card" = fixed 200px scroller item, "tile" = flexible grid cell */
  variant?: "card" | "tile";
  style?: StyleProp<ViewStyle>;
}

export function FlashDealCard({ product, variant = "card", style }: FlashDealCardProps) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const off = discountPercent(product);
  const saved = amountSaved(product);
  const image = getProductImage(product);
  const lowStock = product.stock <= 5;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${off} percent off`}
      style={[styles.base, variant === "card" ? styles.card : styles.tile, animatedStyle, style]}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 220 });
      }}
      onPress={() => {
        Haptics.selectionAsync();
        router.push(`/product/${product.slug}`);
      }}
    >
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
        ) : (
          <ProductVisual category={product.category} glyphSize={34} />
        )}

        <View style={styles.offPill}>
          <Text style={styles.offPillText}>{off}% OFF</Text>
        </View>

        {lowStock && (
          <View style={styles.scarcePill}>
            <Text style={styles.scarcePillText}>
              Limited Stock
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.category}>{product.category.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatGHS(product.priceGHS)}</Text>
          <Text style={styles.wasPrice}>{formatGHS(product.compareAtPriceGHS || 0)}</Text>
        </View>

        <Text style={styles.saved}>You save {formatGHS(saved)}</Text>

        <Text style={styles.stockCaption}>
          {product.stock > 0 ? "In Stock · Ready for Delivery" : "Out of Stock"}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden"
  },
  card: {
    width: 200
  },
  tile: {
    flexBasis: "48%"
  },
  imageWrap: {
    height: 164,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    overflow: "hidden"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  imageFallback: {
    alignItems: "center"
  },
  imageFallbackText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textTertiary,
    letterSpacing: 1
  },
  offPill: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: colors.brandRed,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full
  },
  offPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  scarcePill: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: colors.brandRedBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full
  },
  scarcePillText: {
    color: colors.brandRed,
    fontSize: 10,
    fontWeight: "800"
  },
  body: {
    padding: 12
  },
  category: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.textTertiary
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 19,
    marginTop: 3,
    minHeight: 38
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 6
  },
  price: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3
  },
  wasPrice: {
    fontSize: 13,
    color: colors.textTertiary,
    textDecorationLine: "line-through"
  },
  saved: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandRed,
    marginTop: 2
  },
  track: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: 10,
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: colors.brandRed
  },
  stockCaption: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 5
  }
});

export default FlashDealCard;
