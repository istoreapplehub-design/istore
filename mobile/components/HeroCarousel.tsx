import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Carousel } from "react-native-reanimated-carousel";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, formatGHS, radius } from "../constants/theme";
import { Product } from "../types";
import { SkeletonHeroBanner } from "./SkeletonLoader";
import { ProductVisual, getProductImage } from "./ProductVisual";

interface HeroCarouselProps {
  products: Product[];
}

const SLIDE_HEIGHT = 470;

/**
 * Apple-style editorial hero: light stage, centred headline, product image below,
 * and the signature "Buy" pill paired with a "Learn more" text link.
 * Fully responsive across phone, mobile web toggle, and tablet emulator.
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
    <View style={[styles.container, { width: "100%", alignItems: "center" }]}>
      <Carousel<Product>
        loop
        style={{ width: carouselWidth, height: SLIDE_HEIGHT }}
        itemSize={carouselWidth}
        autoplay
        autoplayInterval={5200}
        data={slides}
        onSnapToItem={(index: number) => setActiveIndex(index)}
        renderItem={({ item, index }: { item: Product; index: number }) => {
          const image = getProductImage(item);
          const subtitle = [item.model, item.storage].filter(Boolean).join(" · ");
          const tagline =
            subtitle || (item.condition === "Refurbished" ? "Certified refurbished" : "New, sealed in box");

          return (
            <View style={[styles.slide, { width: carouselWidth }]}>
              <View style={styles.copy}>
                <Animated.View
                  entering={FadeInDown.delay(index * 60).duration(420)}
                  style={{ alignItems: "center" }}
                >
                  <View style={styles.eyebrowPill}>
                    <View style={styles.eyebrowDot} />
                    <Text style={styles.eyebrow}>{item.category.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.tagline} numberOfLines={1}>
                    {tagline}
                  </Text>
                </Animated.View>

                <Animated.View
                  entering={FadeInUp.delay(index * 60 + 90).duration(420)}
                  style={styles.ctaRow}
                >
                  <Pressable
                    style={({ pressed }) => [styles.buyPill, pressed && { opacity: 0.85 }]}
                    onPress={() => open(item)}
                  >
                    <Text style={styles.buyPillText}>Buy Now</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.learnMore, pressed && { opacity: 0.6 }]}
                    onPress={() => open(item)}
                  >
                    <Text style={styles.learnMoreText}>Learn more</Text>
                    <Ionicons name="chevron-forward" size={13} color={colors.accent} />
                  </Pressable>
                </Animated.View>
              </View>

              <View style={styles.stage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
                ) : (
                  <ProductVisual
                    category={item.category}
                    glyphSize={76}
                    style={styles.visualFill}
                  />
                )}
              </View>

              <View style={styles.priceStrip}>
                <Text style={styles.priceLabel}>From</Text>
                <Text style={styles.priceValue}>{formatGHS(item.priceGHS)}</Text>
                {item.compareAtPriceGHS && item.compareAtPriceGHS > item.priceGHS ? (
                  <View style={styles.dealChip}>
                    <Text style={styles.dealChipText}>
                      Save {formatGHS(item.compareAtPriceGHS - item.priceGHS)}
                    </Text>
                  </View>
                ) : null}
              </View>
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
    height: SLIDE_HEIGHT,
    position: "relative"
  },
  slide: {
    height: SLIDE_HEIGHT,
    backgroundColor: colors.surface,
    paddingHorizontal: 20
  },
  copy: {
    alignItems: "center",
    paddingTop: 22
  },
  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandRedSoft,
    borderWidth: 1,
    borderColor: colors.brandRedBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandRed
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.brandRed
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -1,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 40
  },
  tagline: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 14
  },
  buyPill: {
    backgroundColor: colors.brandRed,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.full,
    shadowColor: colors.brandRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  buyPillText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2
  },
  learnMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  learnMoreText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.accent
  },
  stage: {
    flex: 1,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8
  },
  image: {
    width: "86%",
    height: "100%"
  },
  visualFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  priceStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 34,
    paddingTop: 10
  },
  priceLabel: {
    fontSize: 13,
    color: colors.textSecondary
  },
  priceValue: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3
  },
  dealChip: {
    backgroundColor: colors.brandRedSoft,
    borderWidth: 1,
    borderColor: colors.brandRedBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full
  },
  dealChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandRed
  },
  pagination: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6
  },
  dot: {
    height: 6,
    borderRadius: radius.full
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.brandRed
  },
  dotIdle: {
    width: 6,
    backgroundColor: "#C9C9CE"
  }
});

export default HeroCarousel;
