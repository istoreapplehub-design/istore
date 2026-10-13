import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useRouter } from "expo-router";
import { Carousel } from "react-native-reanimated-carousel";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, radius, spacing } from "../constants/theme";
import { Product } from "../types";
import { SkeletonHeroBanner } from "./SkeletonLoader";

interface HeroCarouselProps {
  products: Product[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_HEIGHT = 400;

const AnimatedImage = Animated.createAnimatedComponent(Image);

export function HeroCarousel({ products }: HeroCarouselProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  // Subtle continuous Ken Burns zoom animation
  const kenBurnsScale = useSharedValue(1);

  useEffect(() => {
    kenBurnsScale.value = withRepeat(
      withTiming(1.06, {
        duration: 6000,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );
  }, [kenBurnsScale]);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: kenBurnsScale.value }]
  }));

  const carouselData = useMemo(() => {
    return products && products.length > 0 ? products.slice(0, 5) : [];
  }, [products]);

  if (carouselData.length === 0) {
    return <SkeletonHeroBanner />;
  }

  return (
    <View style={styles.container}>
      <Carousel<Product>
        loop
        style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }}
        itemSize={SCREEN_WIDTH}
        autoplay={true}
        autoplayInterval={4500}
        data={carouselData}
        onSnapToItem={(index: number) => setActiveIndex(index)}
        renderItem={({ item }: { item: Product }) => {
          const imageUrl =
            item.images && item.images.length > 0
              ? item.images[0]
              : "https://placehold.co/800x800?text=Apple+Hero";

          const categoryBadge = `${item.category.toUpperCase()}`;
          const subtitle = [item.model, item.storage].filter(Boolean).join(" • ");

          return (
            <Pressable
              style={styles.slide}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/product/${item.slug}`);
              }}
            >
              <AnimatedImage
                source={{ uri: imageUrl }}
                style={[styles.slideImage, animatedImageStyle]}
                resizeMode="cover"
              />

              <LinearGradient
                colors={[colors.gradientTop, colors.gradientBottom]}
                style={styles.gradientOverlay}
              />

              <View style={styles.textOverlay}>
                <Text style={styles.categoryBadge}>{categoryBadge}</Text>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                {subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}

                <View style={styles.ctaButton}>
                  <Text style={styles.ctaText}>Shop Now</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {/* Pagination Dot Indicators */}
      <View style={styles.paginationContainer}>
        {carouselData.map((_, index) => {
          const isActive = index === activeIndex;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isActive ? styles.dotActive : styles.dotInactive
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    position: "relative"
  },
  slide: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    position: "relative",
    overflow: "hidden"
  },
  slideImage: {
    width: "100%",
    height: "100%"
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 240
  },
  textOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 48,
    paddingHorizontal: spacing.lg
  },
  categoryBadge: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.85)"
  },
  productName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginTop: 6
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    fontWeight: "400"
  },
  ctaButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: radius.pill,
    marginTop: spacing.md
  },
  ctaText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2
  },
  paginationContainer: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6
  },
  dot: {
    height: 6,
    borderRadius: 3
  },
  dotActive: {
    width: 18,
    backgroundColor: "#FFFFFF"
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(255, 255, 255, 0.5)"
  }
});
