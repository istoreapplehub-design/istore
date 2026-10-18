import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Carousel } from "react-native-reanimated-carousel";
import * as Haptics from "expo-haptics";
import { colors, formatGHS, radius } from "../constants/theme";
import { Product } from "../types";
import { SkeletonHeroBanner } from "./SkeletonLoader";
import { ProductVisual, getProductImage } from "./ProductVisual";

interface HeroCarouselProps {
  products: Product[];
}

const SLIDE_HEIGHT = 256;

/**
 * Dribbble-inspired Split-Stage Obsidian Titanium Bento Hero:
 * Deep carbon gradient card, ambient crimson glow, editorial left column,
 * and a frosted glass studio pedestal on the right.
 */
export function HeroCarousel({ products }: HeroCarouselProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const carouselWidth = Math.min(width, 820);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = useMemo(
    () => (products && products.length > 0 ? products.slice(0, 5) : []),
    [products]
  );

  if (slides.length === 0) {
    return <SkeletonHeroBanner />;
  }

  const open = (item: Product) => {
    Haptics.selectionAsync();
    router.push(`/product/${item.slug}`);
  };

  return (
    <View style={styles.container}>
      <Carousel<Product>
        loop
        style={{ width: carouselWidth, height: SLIDE_HEIGHT }}
        itemSize={carouselWidth}
        autoplay
        autoplayInterval={5200}
        data={slides}
        onSnapToItem={(index: number) => setActiveIndex(index)}
        renderItem={({ item }: { item: Product; index: number }) => {
          const image = getProductImage(item);
          const subtitle = [item.storage, item.condition === "Refurbished" ? "Certified" : "1 Yr Warranty"]
            .filter(Boolean)
            .join(" · ");
          const hasDiscount = Boolean(
            item.compareAtPriceGHS && item.compareAtPriceGHS > item.priceGHS
          );
          const discountPct = hasDiscount
            ? Math.round(
                (((item.compareAtPriceGHS as number) - item.priceGHS) /
                  (item.compareAtPriceGHS as number)) *
                  100
              )
            : 0;

          return (
            <View style={[styles.slideOuter, { width: carouselWidth }]}>
              <Pressable
                onPress={() => open(item)}
                style={({ pressed }) => [
                  styles.bentoCard,
                  pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }
                ]}
              >
                <LinearGradient
                  colors={["#181822", "#0B0B10"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Ambient decorative glow */}
                <View style={styles.crimsonGlow} />

                {/* Left Editorial Column */}
                <View style={styles.leftCol}>
                  <View style={styles.badgeRow}>
                    <View style={styles.eyebrowPill}>
                      <View style={styles.eyebrowDot} />
                      <Text style={styles.eyebrow}>{item.category.toUpperCase()}</Text>
                    </View>
                    {discountPct > 0 && (
                      <View style={styles.discountPill}>
                        <Text style={styles.discountPillText}>-{discountPct}%</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.title} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>

                  <View style={styles.priceBlock}>
                    <Text style={styles.priceValue}>{formatGHS(item.priceGHS)}</Text>
                    {hasDiscount && (
                      <Text style={styles.comparePrice}>
                        {formatGHS(item.compareAtPriceGHS as number)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.ctaRow}>
                    <View style={styles.buyPill}>
                      <Text style={styles.buyPillText}>Shop Now</Text>
                      <View style={styles.buyArrowCircle}>
                        <Ionicons name="arrow-forward" size={12} color={colors.brandRed} />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Right Studio Device Pedestal */}
                <View style={styles.rightCol}>
                  <View style={styles.pedestal}>
                    <View style={styles.ratingGlass}>
                      <Ionicons name="star" size={10} color="#FBBF24" />
                      <Text style={styles.ratingGlassText}>{item.rating.toFixed(1)}</Text>
                    </View>

                    {image ? (
                      <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
                    ) : (
                      <ProductVisual
                        category={item.category}
                        glyphSize={58}
                        style={styles.visualFill}
                      />
                    )}

                    {Array.isArray(item.colors) && item.colors.length > 0 && (
                      <View style={styles.swatchRow}>
                        {item.colors.slice(0, 4).map((c, idx) => (
                          <View
                            key={c.name || idx}
                            style={[
                              styles.swatchDot,
                              { backgroundColor: c.hex || "#CCCCCC" }
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            </View>
          );
        }}
      />

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex ? styles.dotActive : styles.dotIdle]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 4
  },
  slideOuter: {
    height: SLIDE_HEIGHT,
    paddingHorizontal: 16,
    justifyContent: "center"
  },
  bentoCard: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    flexDirection: "row",
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8
  },
  crimsonGlow: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(225, 29, 72, 0.18)"
  },
  leftCol: {
    flex: 1.25,
    justifyContent: "space-between",
    paddingRight: 10,
    zIndex: 2
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.brandRed
  },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#FFFFFF"
  },
  discountPill: {
    backgroundColor: colors.brandRed,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: radius.full
  },
  discountPillText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.3
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.6,
    lineHeight: 26,
    marginTop: 6
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.62)",
    marginTop: 2
  },
  priceBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 7,
    marginTop: 8
  },
  priceValue: {
    fontSize: 19,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4
  },
  comparePrice: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.42)",
    textDecorationLine: "line-through"
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10
  },
  buyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brandRed,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: radius.full,
    shadowColor: colors.brandRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4
  },
  buyPillText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: -0.1
  },
  buyArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  rightCol: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  pedestal: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 0,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  ratingGlass: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#0D0D12",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    zIndex: 3
  },
  ratingGlassText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  visualFill: {
    width: "100%",
    height: "100%"
  },
  swatchRow: {
    position: "absolute",
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(13,13,18,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full
  },
  swatchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)"
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 10
  },
  dot: {
    height: 5,
    borderRadius: radius.full
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.brandRed
  },
  dotIdle: {
    width: 6,
    backgroundColor: "#D4D4DA"
  }
});

export default HeroCarousel;

