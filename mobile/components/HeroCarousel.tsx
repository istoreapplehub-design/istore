import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Carousel } from "react-native-reanimated-carousel";
import * as Haptics from "expo-haptics";
import { colors, formatGHS, radius } from "../constants/theme";
import { Product } from "../types";
import { SkeletonHeroBanner } from "./SkeletonLoader";
import { ProductVisual, getProductImage } from "./ProductVisual";

interface HeroCarouselProps {
  products: Product[];
}

const SLIDE_HEIGHT = 264;

const HERO_TAGLINES: Record<string, string> = {
  iPhone: "Engineered for Apple Intelligence.",
  Mac: "Supercharged by M5 silicon.",
  iPad: "Thin. Light. Ultra-capable.",
  Watch: "Built for endurance and precision.",
  AirPods: "Immersive acoustic perfection.",
  Accessories: "Designed to pair seamlessly."
};

/**
 * Minimalist Apple-Store-inspired Flagship Hero Carousel:
 * Clean editorial typography, generous whitespace, real product imagery,
 * and a clear "Shop Now" call-to-action.
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
        autoplayInterval={5400}
        data={slides}
        onSnapToItem={(index: number) => setActiveIndex(index)}
        renderItem={({ item }: { item: Product; index: number }) => {
          const image = getProductImage(item);
          const headline =
            HERO_TAGLINES[item.category] ||
            [item.storage, item.warranty].filter(Boolean).join(" · ");
          const hasDiscount = Boolean(
            item.compareAtPriceGHS && item.compareAtPriceGHS > item.priceGHS
          );

          return (
            <View style={[styles.slideOuter, { width: carouselWidth }]}>
              <Pressable
                onPress={() => open(item)}
                style={({ pressed }) => [
                  styles.heroCard,
                  pressed && { opacity: 0.96, transform: [{ scale: 0.995 }] }
                ]}
              >
                {/* Left Editorial Column */}
                <View style={styles.leftCol}>
                  <View>
                    <View style={styles.eyebrowRow}>
                      <Text style={styles.eyebrow}>FLAGSHIP · {item.category.toUpperCase()}</Text>
                    </View>

                    <Text style={styles.title} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.headline} numberOfLines={2}>
                      {headline}
                    </Text>
                  </View>

                  <View style={styles.bottomLeft}>
                    <View style={styles.priceBlock}>
                      <Text style={styles.priceValue}>{formatGHS(item.priceGHS)}</Text>
                      {hasDiscount && (
                        <Text style={styles.comparePrice}>
                          {formatGHS(item.compareAtPriceGHS as number)}
                        </Text>
                      )}
                    </View>

                    <View style={styles.ctaRow}>
                      <View style={styles.shopNowBtn}>
                        <Text style={styles.shopNowText}>Shop Now</Text>
                        <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Right Product Stage */}
                <View style={styles.rightCol}>
                  <View style={styles.pedestal}>
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
  heroCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    flexDirection: "row",
    padding: 18
  },
  leftCol: {
    flex: 1.25,
    justifyContent: "space-between",
    paddingRight: 12
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: colors.brandAccent
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 27,
    marginTop: 6
  },
  headline: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 4
  },
  bottomLeft: {
    gap: 10
  },
  priceBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 7
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3
  },
  comparePrice: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textTertiary,
    textDecorationLine: "line-through"
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  shopNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.full
  },
  shopNowText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1
  },
  rightCol: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  pedestal: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
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
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  swatchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)"
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
    width: 20,
    backgroundColor: colors.text
  },
  dotIdle: {
    width: 6,
    backgroundColor: "#D2D2D7"
  }
});

export default HeroCarousel;
