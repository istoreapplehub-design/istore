import React, { useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue
} from "react-native-reanimated";
import AppHeader from "../../components/AppHeader";
import ErrorState from "../../components/ErrorState";
import { AppleCategoryRibbon } from "../../components/AppleCategoryRibbon";
import CountdownTimer from "../../components/CountdownTimer";
import { HeroCarousel } from "../../components/HeroCarousel";
import { FlashDealCard } from "../../components/FlashDealCard";
import { ProductCard } from "../../components/ProductCard";
import { SectionHeader } from "../../components/SectionHeader";
import { ValuePropRail } from "../../components/ValuePropRail";
import { SkeletonProductCard } from "../../components/SkeletonLoader";
import { ProductVisual, getProductImage } from "../../components/ProductVisual";
import { useHomeData } from "../../hooks/useHomeData";
import { useFlashDeals } from "../../hooks/useFlashDeals";
import { colors, formatGHS, radius, spacing } from "../../constants/theme";

const EDITORIAL_GAP = 14;

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const editorialWidth = Math.min(Math.max(width - 56, 260), 380);
  const { featured, newArrivals, bestSellers, loading, error, refetch } = useHomeData();
  const { deals, products, endsAt, error: flashError } = useFlashDeals();

  const [scrolled, setScrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrolledFlag = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const past = event.contentOffset.y > 6;
      if (past && scrolledFlag.value === 0) {
        scrolledFlag.value = 1;
        runOnJS(setScrolled)(true);
      } else if (!past && scrolledFlag.value === 1) {
        scrolledFlag.value = 0;
        runOnJS(setScrolled)(false);
      }
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  };

  const heroProducts = featured.length > 0 ? featured : newArrivals.slice(0, 5);
  const editorial = newArrivals.slice(0, 6);

  // With no catalog to show, say why instead of rendering an empty-looking store.
  const nothingLoaded =
    !loading && heroProducts.length === 0 && editorial.length === 0 && bestSellers.length === 0;

  if (nothingLoaded && (error || flashError)) {
    return (
      <View style={styles.root}>
        <AppHeader scrolled={scrolled} />
        <ErrorState error={error || flashError} onRetry={() => refetch()} />
      </View>
    );
  }

  if (nothingLoaded) {
    return (
      <View style={styles.root}>
        <AppHeader scrolled={scrolled} />
        <ErrorState
          empty
          emptyTitle="The store is being stocked"
          emptySubtitle="No devices are published yet. Please check back shortly."
          emptyIcon="cube-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AppHeader scrolled={scrolled} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Announcement strip */}
        <Pressable
          style={({ pressed }) => [styles.strip, pressed && { opacity: 0.7 }]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/(tabs)/flash");
          }}
        >
          <Ionicons name="flash" size={13} color={colors.text} />
          <Text style={styles.stripText}>
            New flash deals updated daily at midnight
          </Text>
          <Ionicons name="chevron-forward" size={13} color={colors.textTertiary} />
        </Pressable>

        {/* Editorial hero */}
        <HeroCarousel products={heroProducts} />

        {/* Category rail */}
        <View style={styles.ribbonWrap}>
          <AppleCategoryRibbon products={products} />
        </View>

        {/* Flash sales band */}
        {deals.length > 0 && (
          <Animated.View entering={FadeInDown.duration(420)} style={styles.flashBand}>
            <View style={styles.flashBandHead}>
              <View style={styles.flashTitleRow}>
                <Ionicons name="flash" size={17} color="#FFFFFF" />
                <Text style={styles.flashTitle}>Flash Sales</Text>
              </View>
              <CountdownTimer endsAt={endsAt} variant="inline" />
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={deals.slice(0, 8)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.flashListContent}
              renderItem={({ item }) => <FlashDealCard product={item} />}
            />

            <Pressable
              style={({ pressed }) => [styles.flashSeeAll, pressed && { opacity: 0.85 }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/(tabs)/flash");
              }}
            >
              <Text style={styles.flashSeeAllText}>See all {deals.length} deals</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        )}

        {/* The latest — editorial cards */}
        <Animated.View entering={FadeInDown.delay(60).duration(420)}>
          <SectionHeader
            title="The latest"
            subtitle="Take a look at what's new right now"
            onSeeAll={() => router.push("/(tabs)/shop")}
          />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={editorial}
            keyExtractor={(item) => item.id}
            snapToInterval={editorialWidth + EDITORIAL_GAP}
            decelerationRate="fast"
            contentContainerStyle={styles.editorialContent}
            renderItem={({ item }) => {
              const image = getProductImage(item);

              return (
                <Pressable
                  style={[styles.editorialCard, { width: editorialWidth }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/product/${item.slug}`);
                  }}
                >
                  <View style={styles.editorialCopy}>
                    <Text style={styles.editorialEyebrow}>
                      {item.compareAtPriceGHS && item.compareAtPriceGHS > item.priceGHS
                        ? "On sale now"
                        : "Just landed"}
                    </Text>
                    <Text style={styles.editorialTitle} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.editorialPrice}>
                      From {formatGHS(item.priceGHS)}
                    </Text>
                    <View style={styles.editorialLinkRow}>
                      <View style={styles.editorialPill}>
                        <Text style={styles.editorialPillText}>Buy</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={colors.accent} />
                    </View>
                  </View>

                  {image ? (
                    <Image source={{ uri: image }} style={styles.editorialImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.editorialImageFallback}>
                      <ProductVisual category={item.category} glyphSize={54} />
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </Animated.View>

        {/* Most loved */}
        <Animated.View entering={FadeInDown.delay(120).duration(420)}>
          <SectionHeader
            title="Most loved devices"
            subtitle="What our customers keep coming back for"
            onSeeAll={() => router.push("/(tabs)/shop?sort=popular")}
          />
          {loading && bestSellers.length === 0 ? (
            <View style={styles.skeletonRow}>
              <SkeletonProductCard />
              <SkeletonProductCard />
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={bestSellers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.productRowContent}
              renderItem={({ item }) => <ProductCard product={item} variant="grid" />}
            />
          )}
        </Animated.View>

        {/* Why I-Store */}
        <Animated.View entering={FadeInDown.delay(180).duration(420)}>
          <SectionHeader
            title="Why I-Store is the best place to shop Apple."
            subtitle="The parts that matter when it's ₵20,000 on the line"
          />
          <ValuePropRail />
        </Animated.View>

        {/* Guest-safe footer links */}
        <View style={styles.footer}>
          <Text style={styles.footerHeading}>Help is always available</Text>
          <View style={styles.footerLinks}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/help");
              }}
            >
              <Text style={styles.footerLink}>Help Center</Text>
            </Pressable>
            <View style={styles.footerDot} />
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/legal?type=terms");
              }}
            >
              <Text style={styles.footerLink}>Terms</Text>
            </Pressable>
            <View style={styles.footerDot} />
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/legal?type=privacy");
              }}
            >
              <Text style={styles.footerLink}>Privacy</Text>
            </Pressable>
          </View>
          <Ionicons name="logo-apple" size={18} color={colors.textTertiary} />
          <Text style={styles.footerBrand}>I-Store Apple Hub · Worldwide</Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    paddingBottom: 40
  },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  stripText: {
    fontSize: 12.5,
    fontWeight: "500",
    color: colors.text,
    letterSpacing: -0.1
  },
  ribbonWrap: {
    paddingVertical: spacing.lg
  },
  flashBand: {
    marginHorizontal: 16,
    marginBottom: spacing.lg,
    backgroundColor: colors.accentDark,
    borderRadius: radius.xl,
    paddingTop: 18
  },
  flashBandHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 14
  },
  flashTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  flashTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5
  },
  flashListContent: {
    paddingLeft: 18,
    paddingRight: 8,
    gap: 12,
    paddingBottom: 16
  },
  flashSeeAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.16)"
  },
  flashSeeAllText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  },
  editorialContent: {
    paddingHorizontal: 16,
    gap: EDITORIAL_GAP
  },
  editorialCard: {
    height: 380,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden"
  },
  editorialCopy: {
    padding: 18
  },
  editorialEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: colors.textTertiary,
    textTransform: "uppercase"
  },
  editorialTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: colors.text,
    marginTop: 4,
    lineHeight: 27
  },
  editorialPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 5
  },
  editorialLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12
  },
  editorialPill: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.full
  },
  editorialPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600"
  },
  editorialImage: {
    width: "100%",
    flex: 1,
    marginTop: 4
  },
  editorialImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  skeletonRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 14
  },
  productRowContent: {
    paddingHorizontal: 16,
    gap: 14
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
    paddingHorizontal: 24
  },
  footerHeading: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: colors.text
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    marginBottom: spacing.lg
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.border
  },
  footerBrand: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 6
  }
});
