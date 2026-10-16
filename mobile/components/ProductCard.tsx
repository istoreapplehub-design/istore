/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on card tap
 */
import React from "react";
import { Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, radius, shadow, spacing } from "../constants/theme";
import { Product } from "../types";
import { PriceTag } from "./PriceTag";
import { ProductVisual, getProductImage } from "./ProductVisual";
import { StarRating } from "./StarRating";

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "row";
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProductCard({
  product,
  variant = "grid",
  onPress,
  style
}: ProductCardProps) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    if (onPress) {
      onPress();
    } else {
      router.push(`/product/${product.slug}`);
    }
  };

  const imageUrl = getProductImage(product);

  // ─── VARIANT "ROW" ────────────────────────────────────────────────────────
  if (variant === "row") {
    const pillText =
      product.priceGHS === 0
        ? "GET"
        : `₵${product.priceGHS.toLocaleString("en-GH", {
            maximumFractionDigits: 0
          })}`;

    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={`View ${product.name}`}
        style={[styles.rowContainer, animatedStyle, style]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <View style={styles.rowMain}>
          <View style={styles.rowImageWrapper}>
            {/* Shared element transition from card to detail screen */}
            {imageUrl ? (
              <Animated.Image
                sharedTransitionTag={`product-image-${product.id}`}
                source={{ uri: imageUrl }}
                style={styles.rowImage}
                resizeMode="contain"
                accessibilityLabel={product.name}
              />
            ) : (
              <ProductVisual category={product.category} glyphSize={22} />
            )}
          </View>

          <View style={styles.rowContent}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={styles.rowCategory} numberOfLines={1}>
              {product.category}
            </Text>
            <View style={styles.rowRatingWrapper}>
              <StarRating rating={product.rating} size={11} showValue />
            </View>
          </View>

          <View style={styles.rowPill}>
            <Text style={styles.rowPillText}>{pillText}</Text>
          </View>
        </View>

        <View style={styles.rowSeparator} />
      </AnimatedPressable>
    );
  }

  const isOnSale = Boolean(
    product.compareAtPriceGHS && product.compareAtPriceGHS > product.priceGHS
  );

  // ─── VARIANT "GRID" ───────────────────────────────────────────────────────
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`View ${product.name}`}
      style={[styles.gridContainer, animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <View style={styles.gridImageWrapper}>
        {/* Shared element transition from card to detail screen */}
        {imageUrl ? (
          <Animated.Image
            sharedTransitionTag={`product-image-${product.id}`}
            source={{ uri: imageUrl }}
            style={styles.gridImage}
            resizeMode="contain"
            accessibilityLabel={product.name}
          />
        ) : (
          <ProductVisual category={product.category} glyphSize={54} />
        )}

        {isOnSale ? (
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>SALE</Text>
          </View>
        ) : product.featured ? (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>HOT</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.gridContent}>
        <Text style={styles.gridCategory}>{product.category.toUpperCase()}</Text>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.gridPriceWrapper}>
          <PriceTag
            price={product.priceGHS}
            compareAt={product.compareAtPriceGHS}
            size="sm"
          />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  // Grid Variant Styles
  gridContainer: {
    width: 168,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
    overflow: "hidden"
  },
  gridImageWrapper: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.imageBg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm + 4
  },
  gridImage: {
    width: "100%",
    height: "100%"
  },
  saleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.brandRed,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  saleBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  featuredBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  gridContent: {
    padding: spacing.sm + 4
  },
  gridCategory: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: colors.brandRed,
    marginBottom: 2
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    minHeight: 36,
    lineHeight: 18
  },
  gridPriceWrapper: {
    marginTop: spacing.xs + 2
  },

  // Row Variant Styles
  rowContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF"
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.md
  },
  rowImageWrapper: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.imageBg,
    alignItems: "center",
    justifyContent: "center",
    padding: 6
  },
  rowImage: {
    width: "100%",
    height: "100%"
  },
  rowContent: {
    flex: 1
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  },
  rowCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  rowRatingWrapper: {
    marginTop: 4
  },
  rowPill: {
    backgroundColor: colors.brandRedSoft,
    borderWidth: 1,
    borderColor: colors.brandRedBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill
  },
  rowPillText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.brandRed
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 92 // Aligns with text content after 64px image + padding
  }
});

export default ProductCard;

