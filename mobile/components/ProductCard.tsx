import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, formatGHS, radius, spacing } from "../constants/theme";
import { Product } from "../types";
import { ProductVisual, getProductImage } from "./ProductVisual";
import { StarRating } from "./StarRating";
import { useCartStore } from "../store/useCartStore";
import { useWishlistStore } from "../store/useWishlistStore";

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
  const addItem = useCartStore((state) => state.addItem);
  const isWishlisted = useWishlistStore((state) => state.items.includes(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const [justAdded, setJustAdded] = useState(false);

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

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const activeColor = product.colors?.[selectedColorIdx] || product.colors?.[0];
  const colorImg =
    Array.isArray(activeColor?.images) && activeColor.images.length > 0
      ? activeColor.images[0]
      : (activeColor as any)?.image;
  const imageUrl = colorImg || getProductImage(product);

  const handleQuickAdd = () => {
    if (product.stock <= 0) {
      handlePress();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addItem({
      productId: product.id,
      name: product.name,
      priceGHS: product.priceGHS,
      image: imageUrl || "",
      color: activeColor?.name || product.colors?.[0]?.name,
      storage: product.storage || undefined,
      qty: 1
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1100);
  };

  const handleToggleWishlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleWishlist(product.id);
  };

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
              {[product.category, product.storage].filter(Boolean).join(" · ")}
            </Text>
            <View style={styles.rowRatingWrapper}>
              <StarRating rating={product.rating} size={11} showValue />
            </View>
          </View>

          <View style={styles.rowPill}>
            <Text style={styles.rowPillText}>{pillText}</Text>
          </View>

          <Pressable
            hitSlop={10}
            onPress={handleToggleWishlist}
            accessibilityLabel={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            style={({ pressed }) => [
              styles.rowHeartBtn,
              pressed && { opacity: 0.6 }
            ]}
          >
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={18}
              color={isWishlisted ? colors.brandRed : colors.textTertiary}
            />
          </Pressable>
        </View>

        <View style={styles.rowSeparator} />
      </AnimatedPressable>
    );
  }

  const isOnSale = Boolean(
    product.compareAtPriceGHS && product.compareAtPriceGHS > product.priceGHS
  );
  const discountPct = isOnSale
    ? Math.round(
        (((product.compareAtPriceGHS as number) - product.priceGHS) /
          (product.compareAtPriceGHS as number)) *
          100
      )
    : 0;

  // ─── VARIANT "GRID" (Dribbble Studio Pedestal Card) ───────────────────────
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`View ${product.name}`}
      style={[styles.gridContainer, animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      {/* Full-Bleed Studio Image */}
      <View style={styles.gridImageWrapper}>
        {imageUrl ? (
          <Animated.Image
            sharedTransitionTag={`product-image-${product.id}`}
            source={{ uri: imageUrl }}
            style={styles.gridImage}
            resizeMode="cover"
            accessibilityLabel={product.name}
          />
        ) : (
          <ProductVisual category={product.category} glyphSize={48} />
        )}

        {/* Top-left Status / Discount Pill */}
        {discountPct > 0 ? (
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>-{discountPct}%</Text>
          </View>
        ) : product.featured ? (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>NEW</Text>
          </View>
        ) : null}

        {/* Top-right Floating Wishlist Heart */}
        <Pressable
          hitSlop={8}
          onPress={handleToggleWishlist}
          style={({ pressed }) => [
            styles.heartBtn,
            pressed && { transform: [{ scale: 0.9 }] }
          ]}
          accessibilityLabel={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={15}
            color={isWishlisted ? colors.brandRed : "#0D0D12"}
          />
        </Pressable>

        {/* Bottom-left Hardware Finish Swatches */}
        {Array.isArray(product.colors) && product.colors.length > 0 && (
          <View style={styles.swatchBar}>
            {product.colors.slice(0, 4).map((c, idx) => {
              const isSelected = idx === selectedColorIdx;
              return (
                <Pressable
                  key={c.name || idx}
                  hitSlop={6}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    Haptics.selectionAsync();
                    setSelectedColorIdx(idx);
                  }}
                  style={[
                    styles.swatchDot,
                    { backgroundColor: c.hex || "#CCCCCC" },
                    isSelected && styles.swatchDotActive
                  ]}
                />
              );
            })}
            {product.colors.length > 4 && (
              <Text style={styles.swatchMore}>+{product.colors.length - 4}</Text>
            )}
          </View>
        )}
      </View>

      {/* Editorial Info Footer */}
      <View style={styles.gridContent}>
        <View style={styles.metaRow}>
          <Text style={styles.gridCategory} numberOfLines={1}>
            {[product.category, product.storage].filter(Boolean).join(" · ")}
          </Text>
          <View style={styles.ratingMini}>
            <Ionicons name="star" size={10} color="#F59E0B" />
            <Text style={styles.ratingMiniText}>{product.rating.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.gridTitle} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.bottomBar}>
          <View style={styles.priceStack}>
            <Text style={styles.priceMain}>{formatGHS(product.priceGHS)}</Text>
            {isOnSale ? (
              <Text style={styles.priceCompare}>
                {formatGHS(product.compareAtPriceGHS as number)}
              </Text>
            ) : null}
          </View>

          <Pressable
            hitSlop={6}
            onPress={handleQuickAdd}
            style={({ pressed }) => [
              styles.quickAddBtn,
              justAdded && styles.quickAddBtnSuccess,
              pressed && { transform: [{ scale: 0.92 }] }
            ]}
            accessibilityLabel={`Add ${product.name} to bag`}
          >
            <Ionicons
              name={justAdded ? "checkmark" : "add"}
              size={18}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  // Grid Variant Styles
  gridContainer: {
    width: 174,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 0,
    overflow: "hidden",
    borderWidth: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2
  },
  gridImageWrapper: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    overflow: "hidden",
    position: "relative"
  },
  gridImage: {
    width: "100%",
    height: "100%"
  },
  saleBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: colors.brandRed,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.pill
  },
  saleBadgeText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3
  },
  featuredBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#0D0D12",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.pill
  },
  featuredBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  heartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  swatchBar: {
    position: "absolute",
    bottom: 8,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  swatchDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.22)"
  },
  swatchDotActive: {
    transform: [{ scale: 1.22 }],
    borderColor: colors.brandRed,
    borderWidth: 1.5
  },
  swatchMore: {
    fontSize: 8.5,
    fontWeight: "700",
    color: colors.textSecondary
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3
  },
  gridCategory: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 4
  },
  ratingMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2.5
  },
  ratingMiniText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#0D0D12"
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: "#0D0D12",
    minHeight: 36,
    lineHeight: 18
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8
  },
  priceStack: {
    flex: 1,
    marginRight: 6
  },
  priceMain: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: "#0D0D12"
  },
  priceCompare: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textTertiary,
    textDecorationLine: "line-through",
    marginTop: 1
  },
  quickAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0D0D12",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2
  },
  quickAddBtnSuccess: {
    backgroundColor: colors.brandRed
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    overflow: "hidden"
  },
  rowImage: {
    width: "92%",
    height: "92%"
  },
  rowContent: {
    flex: 1
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0D0D12"
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
    fontWeight: "800",
    color: colors.brandRed
  },
  rowHeartBtn: {
    marginLeft: 6,
    padding: 6
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 92
  }
});

export default ProductCard;


