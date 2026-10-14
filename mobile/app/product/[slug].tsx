/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on color swatch, storage pill, and expand description
 * - Haptics.impactAsync("light") on wishlist toggle and back button
 * - Haptics.impactAsync("medium") on Add to Bag and Buy Now
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DimensionValue,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  Text,
  View
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing, typography } from "../../constants/theme";
import { createReview, getProduct, getReviews } from "../../services/api";
import { Product, Review } from "../../types";
import { useCartStore } from "../../store/useCartStore";
import { useWishlistStore } from "../../store/useWishlistStore";
import { useUserStore } from "../../store/useUserStore";
import { ProductVisual } from "../../components/ProductVisual";
import { ColorPicker } from "../../components/ColorPicker";
import { PriceTag } from "../../components/PriceTag";
import { ProductCard } from "../../components/ProductCard";
import { SectionHeader } from "../../components/SectionHeader";
import { SkeletonLoader } from "../../components/SkeletonLoader";
import { StarRating } from "../../components/StarRating";
import { StoragePicker } from "../../components/StoragePicker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_CAROUSEL_HEIGHT = 420;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reviews & rating summary
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<{
    breakdown: Record<string, number>;
    total: number;
    avgRating: number;
  } | null>(null);

  // Review composer
  const [showReviewSheet, setShowReviewSheet] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { userId, name: userName } = useUserStore();

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedStorage, setSelectedStorage] = useState<string>("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const cartAddItem = useCartStore((state) => state.addItem);
  const isWishlisted = useWishlistStore((state) =>
    product ? state.isWishlisted(product.id) : false
  );
  const toggleWishlist = useWishlistStore((state) => state.toggle);

  const imageFlatListRef = useRef<FlatList>(null);
  const scrollY = useSharedValue(0);
  const stickyBarY = useSharedValue(120);

  // Fetch product on mount
  const loadProduct = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProduct(slug);
      setProduct(data);
      if (data.colors && data.colors.length > 0) {
        setSelectedColor(data.colors[0].name);
      }
      if (data.storage) {
        setSelectedStorage(data.storage);
      }

      getReviews(slug, { limit: 50 })
        .then((res) => {
          setRecentReviews(res.data);
          const meta = res.meta as typeof res.meta & {
            avgRating?: number;
            ratingBreakdown?: Record<string, number>;
            total?: number;
          };
          if (meta.ratingBreakdown) {
            setReviewStats({
              breakdown: meta.ratingBreakdown,
              total: meta.total ?? res.data.length,
              avgRating: meta.avgRating ?? data.rating
            });
          }
        })
        .catch(() => {
          // Reviews are supplementary; product view still works without them
        });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Product not found");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Track scroll position for top bar and sticky bottom CTA
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.value = y;
      if (y > 500) {
        stickyBarY.value = withSpring(0, { damping: 18, stiffness: 220 });
      } else {
        stickyBarY.value = withSpring(120, { damping: 18, stiffness: 220 });
      }
    }
  });

  const topBarAnimatedStyle = useAnimatedStyle(() => {
    const isScrolledPast = scrollY.value > 200;
    return {
      backgroundColor: isScrolledPast ? "#FFFFFF" : "transparent",
      borderBottomWidth: isScrolledPast ? StyleSheet.hairlineWidth : 0,
      borderBottomColor: colors.border
    };
  });

  const stickyBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: stickyBarY.value }]
  }));

  // Resolve active images based on selected color
  const activeImages = useMemo(() => {
    if (!product) return [];
    const colorObj = selectedColor
      ? product.colors?.find((c) => c.name === selectedColor)
      : undefined;
    const raw = colorObj?.images?.length ? colorObj.images : product.images || [];
    return raw.filter((url) => url && !url.includes("placehold.co"));
  }, [product, selectedColor]);

  // When color changes, reset image carousel to first slide
  useEffect(() => {
    setActiveImageIndex(0);
    imageFlatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [selectedColor]);

  const storageOptions = useMemo(() => {
    if (!product) return [];
    if (product.storage) {
      if (product.category === "iPhone" || product.category === "iPad") {
        return ["128GB", "256GB", "512GB", "1TB"].filter((s) => s >= product.storage!);
      }
      return [product.storage];
    }
    return [];
  }, [product]);

  const handleAddToCart = () => {
    if (!product || addingToCart) return;
    setAddingToCart(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    cartAddItem({
      productId: product.id,
      name: product.name,
      priceGHS: product.priceGHS,
      image: activeImages[0] || "",
      color: selectedColor || undefined,
      storage: selectedStorage || undefined,
      qty: 1
    });

    setAddedSuccess(true);
    setAddedToast(true);
    setTimeout(() => {
      setAddingToCart(false);
      setAddedSuccess(false);
    }, 1200);
    setTimeout(() => setAddedToast(false), 2200);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const handleSubmitReview = async () => {
    if (!product || !userId) return;

    setSubmittingReview(true);
    try {
      const res = await createReview(
        product.slug,
        {
          rating: reviewRating,
          title: reviewTitle.trim(),
          body: reviewBody.trim(),
          authorName: userName || "Verified Customer"
        },
        userId
      );

      setProduct((prev) =>
        prev
          ? {
              ...prev,
              rating: res.product.rating,
              reviewCount: res.product.reviewCount
            }
          : prev
      );
      setRecentReviews((prev) => [res.review, ...prev]);
      setReviewStats((prev) => {
        const breakdown = { ...(prev?.breakdown ?? {}) };
        const key = String(reviewRating);
        breakdown[key] = (breakdown[key] ?? 0) + 1;
        return {
          breakdown,
          total: (prev?.total ?? 0) + 1,
          avgRating: res.product.rating
        };
      });

      setShowReviewSheet(false);
      setReviewTitle("");
      setReviewBody("");
      setReviewRating(5);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      Alert.alert(
        "Review Failed",
        err instanceof Error ? err.message : "Could not submit your review."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `Check out the ${product.name} at I-Store: ₵${product.priceGHS.toLocaleString("en-GH")}`
      });
    } catch {
      // Ignored
    }
  };

  // ─── LOADING STATE ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <View style={[styles.navBar, { top: insets.top }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.circleBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <SkeletonLoader width={SCREEN_WIDTH} height={420} radius={0} />
        <View style={{ padding: spacing.md, marginTop: spacing.md }}>
          <SkeletonLoader width="40%" height={20} />
          <View style={{ marginTop: spacing.sm }}>
            <SkeletonLoader width="70%" height={28} />
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <SkeletonLoader width="30%" height={24} />
          </View>
          <View style={{ marginTop: spacing.lg }}>
            <SkeletonLoader height={52} radius={980} />
          </View>
        </View>
      </View>
    );
  }

  // ─── ERROR STATE ──────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.errorTitle}>{"Couldn't load this product"}</Text>
        <Text style={styles.errorSub}>{error || "This item may be unavailable."}</Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
          <Pressable
            style={styles.backBtnPill}
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
          <Pressable
            style={[styles.backBtnPill, { backgroundColor: colors.accent }]}
            onPress={() => {
              Haptics.selectionAsync();
              loadProduct();
            }}
          >
            <Text style={[styles.backBtnText, { color: "#FFFFFF" }]}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const breakdownRows = reviewStats
    ? [5, 4, 3, 2, 1].map((star) => {
        const count =
          reviewStats.breakdown[String(star)] ?? reviewStats.breakdown[star] ?? 0;
        const pct = reviewStats.total > 0 ? Math.round((count / reviewStats.total) * 100) : 0;
        return { star, count, pct };
      })
    : null;

  const displayedReviews =
    recentReviews.length > 0 ? recentReviews : (product.reviews || []).slice(0, 3);

  return (
    <View style={styles.root}>
      {/* ─── 1. TOP NAV OVERLAY ─────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.navBar,
          { top: 0, paddingTop: insets.top, height: 52 + insets.top },
          topBarAnimatedStyle
        ]}
      >
        <Pressable
          style={styles.circleBtn}
          hitSlop={8}
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.navRightRow}>
          <Pressable style={styles.circleBtn} hitSlop={8} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </Pressable>

          <Pressable
            style={styles.circleBtn}
            hitSlop={8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleWishlist(product.id);
            }}
          >
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={22}
              color={isWishlisted ? colors.badge : colors.text}
            />
          </Pressable>
        </View>
      </Animated.View>

      {/* ─── MAIN CONTENT SCROLLER ──────────────────────────────────────── */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* ─── 2. IMAGE CAROUSEL ────────────────────────────────────────── */}
        <View style={styles.carouselContainer}>
          {activeImages.length === 0 ? (
            <View style={styles.imageSlide}>
              <ProductVisual category={product.category} glyphSize={110} />
            </View>
          ) : (
            <>
              <FlatList
                ref={imageFlatListRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                data={activeImages}
                keyExtractor={(_, index) => `img-${index}`}
                onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                  const offsetX = e.nativeEvent.contentOffset.x;
                  const idx = Math.round(offsetX / SCREEN_WIDTH);
                  setActiveImageIndex(idx);
                }}
                renderItem={({ item, index }) => (
                  <View style={styles.imageSlide}>
                    <Animated.Image
                      sharedTransitionTag={
                        index === 0 && product?.id ? `product-image-${product.id}` : undefined
                      }
                      source={{ uri: item }}
                      style={styles.carouselImage}
                      resizeMode="contain"
                      accessibilityLabel={product?.name}
                    />
                  </View>
                )}
              />

              {/* Dot Indicators */}
              {activeImages.length > 1 && (
                <View style={styles.dotsRow}>
                  {activeImages.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i === activeImageIndex ? styles.dotActive : styles.dotInactive
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* ─── 3. PRODUCT INFO ──────────────────────────────────────────── */}
        <View style={styles.infoContainer}>
          <Text style={styles.categoryEyebrow}>
            {product.category.toUpperCase()}
          </Text>
          <Text style={styles.productTitle}>{product.name}</Text>
          {product.model ? (
            <Text style={styles.productSubtitle}>
              {[product.model, product.storage].filter(Boolean).join(" • ")}
            </Text>
          ) : null}

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <StarRating
              rating={product.rating}
              size={15}
              showValue
              reviewCount={product.reviewCount}
            />
          </View>

          {/* Price Tag */}
          <View style={styles.priceContainer}>
            <PriceTag
              price={product.priceGHS}
              compareAt={product.compareAtPriceGHS}
              size="lg"
            />
            <Text style={styles.paystackHint}>MTN MoMo, Telecel Cash, AT Money or card via Paystack</Text>
          </View>

          {/* ─── 4. COLOR PICKER ────────────────────────────────────────── */}
          {product.colors && product.colors.length > 0 && (
            <View style={styles.pickerSection}>
              <Text style={styles.sectionLabel}>Select Color</Text>
              <ColorPicker
                colors={product.colors}
                selected={selectedColor}
                onSelect={setSelectedColor}
              />
            </View>
          )}

          {/* ─── 5. STORAGE PICKER ──────────────────────────────────────── */}
          {storageOptions.length > 0 && (
            <View style={styles.pickerSection}>
              <Text style={styles.sectionLabel}>Select Storage</Text>
              <StoragePicker
                options={storageOptions}
                selected={selectedStorage}
                onSelect={setSelectedStorage}
              />
            </View>
          )}

          {/* Added to Bag Toast Banner */}
          {addedToast && (
            <Animated.View entering={FadeIn} style={styles.toastBanner}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.toastText}>Added to your Bag!</Text>
            </Animated.View>
          )}

          {/* ─── 6. PRIMARY CTA BUTTONS ─────────────────────────────────── */}
          <View style={styles.ctaWrapper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={addedSuccess ? "Added to Bag" : "Add to Bag"}
              disabled={addingToCart}
              style={[
                styles.addBagBtn,
                addedSuccess && { backgroundColor: colors.success },
                addingToCart && { opacity: 0.75 }
              ]}
              onPress={handleAddToCart}
            >
              <Text style={styles.addBagText}>
                {addedSuccess ? "✓ Added to Bag" : "Add to Bag"}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Buy Now"
              style={styles.buyNowBtn}
              onPress={handleBuyNow}
            >
              <Text style={styles.buyNowText}>Buy Now</Text>
            </Pressable>
          </View>

          {/* ─── 7. SPECIFICATIONS TABLE ────────────────────────────────── */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <View style={styles.detailsBlock}>
              <Text style={styles.blockTitle}>Specifications</Text>
              {Object.entries(product.specs).map(([key, val]) => {
                if (!val) return null;
                const formattedKey = key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase());

                return (
                  <View key={key} style={styles.specRow}>
                    <Text style={styles.specKey}>{formattedKey}</Text>
                    <Text style={styles.specValue}>{val}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ─── 8. ABOUT THIS ITEM (DESCRIPTION) ────────────────────────── */}
          <View style={styles.detailsBlock}>
            <Text style={styles.blockTitle}>About this item</Text>
            <Text
              style={styles.descBody}
              numberOfLines={expanded ? undefined : 4}
            >
              {product.description}
            </Text>
            <Pressable
              hitSlop={8}
              style={{ marginTop: 6 }}
              onPress={() => {
                Haptics.selectionAsync();
                setExpanded(!expanded);
              }}
            >
              <Text style={styles.readMoreText}>
                {expanded ? "Read less" : "Read more"}
              </Text>
            </Pressable>
          </View>

          {/* ─── 9. RATINGS & REVIEWS ───────────────────────────────────── */}
          <View style={styles.detailsBlock}>
            <View style={styles.reviewHeaderRow}>
              <Text style={styles.blockTitle}>Ratings & Reviews</Text>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (!userId) {
                    router.push(`/(auth)/login?returnTo=product/${product.slug}`);
                    return;
                  }
                  setShowReviewSheet(true);
                }}
                style={({ pressed }) => [styles.writeReviewBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="create-outline" size={14} color={colors.text} />
                <Text style={styles.writeReviewText}>Write a Review</Text>
              </Pressable>
            </View>

            <View style={styles.reviewSummaryRow}>
              <View style={styles.summaryLeft}>
                <Text style={styles.bigRatingText}>
                  {(reviewStats?.avgRating ?? product.rating).toFixed(1)}
                </Text>
                <StarRating rating={reviewStats?.avgRating ?? product.rating} size={13} />
                <Text style={styles.summaryTotalText}>
                  {reviewStats?.total ?? product.reviewCount} ratings
                </Text>
              </View>

              {breakdownRows && breakdownRows.some((r) => r.count > 0) && (
                <View style={styles.summaryRight}>
                  {breakdownRows.map((row) => (
                    <View key={row.star} style={styles.barRow}>
                      <Text style={styles.starNumText}>{row.star}★</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${row.pct}%` as DimensionValue }
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Preview Reviews */}
            {displayedReviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {displayedReviews.slice(0, 3).map((r) => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{r.authorName}</Text>
                      <StarRating rating={r.rating} size={11} />
                    </View>
                    <Text style={styles.reviewItemTitle}>{r.title}</Text>
                    <Text style={styles.reviewItemBody} numberOfLines={4}>
                      {r.body}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noReviewsText}>
                No reviews yet. Be the first to review this product.
              </Text>
            )}
          </View>
        </View>

        {/* ─── 10. RELATED PRODUCTS ─────────────────────────────────────── */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <SectionHeader title="You May Also Like" />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={product.relatedProducts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.relatedListContent}
              renderItem={({ item }) => (
                <ProductCard product={item} variant="grid" />
              )}
            />
          </View>
        )}
      </Animated.ScrollView>

      {/* ─── 11. STICKY BOTTOM BAR (APP STORE STYLE) ───────────────────── */}
      <Animated.View
        style={[
          styles.stickyBottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
          stickyBarAnimatedStyle
        ]}
      >
        <View style={styles.stickyLeft}>
          {activeImages[0] ? (
            <Image
              source={{ uri: activeImages[0] }}
              style={styles.stickyThumb}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.stickyThumbFallback}>
              <ProductVisual category={product.category} glyphSize={20} />
            </View>
          )}
          <View style={styles.stickyMeta}>
            <Text style={styles.stickyTitle} numberOfLines={1}>
              {product.name}
            </Text>
            <PriceTag price={product.priceGHS} size="sm" />
          </View>
        </View>

        <Pressable style={styles.stickyCta} onPress={handleAddToCart}>
          <Text style={styles.stickyCtaText}>Add to Bag</Text>
        </Pressable>
      </Animated.View>

      {/* ─── 12. REVIEW COMPOSER SHEET ─────────────────────────────────── */}
      <Modal
        visible={showReviewSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReviewSheet(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetRoot}
        >
          <View style={styles.sheetHeader}>
            <Pressable hitSlop={10} onPress={() => setShowReviewSheet(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.sheetTitle}>Write a Review</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sheetProductName}>{product.name}</Text>

            <Text style={styles.sheetLabel}>Your rating</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable
                  key={s}
                  hitSlop={8}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setReviewRating(s);
                  }}
                >
                  <Ionicons
                    name={s <= reviewRating ? "star" : "star-outline"}
                    size={32}
                    color={colors.text}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={styles.sheetLabel}>Title</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="Sum it up in a few words"
              placeholderTextColor={colors.textTertiary}
              value={reviewTitle}
              onChangeText={setReviewTitle}
              maxLength={100}
            />

            <Text style={styles.sheetLabel}>Your review</Text>
            <TextInput
              style={[styles.sheetInput, styles.sheetBodyInput]}
              placeholder="What did you like or dislike? How was your experience?"
              placeholderTextColor={colors.textTertiary}
              value={reviewBody}
              onChangeText={setReviewBody}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />

            <Pressable
              style={({ pressed }) => [
                styles.sheetSubmitBtn,
                (submittingReview || reviewTitle.trim().length < 3 || reviewBody.trim().length < 10) && { opacity: 0.5 },
                pressed && { transform: [{ scale: 0.99 }] }
              ]}
              disabled={
                submittingReview ||
                reviewTitle.trim().length < 3 ||
                reviewBody.trim().length < 10
              }
              onPress={handleSubmitReview}
            >
              {submittingReview ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.sheetSubmitText}>Submit Review</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.background
  },
  navBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft
  },
  navRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2
  },
  scrollContent: {
    paddingBottom: 140
  },
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_CAROUSEL_HEIGHT,
    backgroundColor: colors.imageBg,
    position: "relative"
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    height: IMAGE_CAROUSEL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl
  },
  carouselImage: {
    width: "100%",
    height: "100%"
  },
  dotsRow: {
    position: "absolute",
    bottom: 20,
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
    backgroundColor: colors.text
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(0, 0, 0, 0.2)"
  },
  infoContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md
  },
  categoryEyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: colors.textSecondary
  },
  productTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.text,
    marginTop: 4
  },
  productSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 2
  },
  ratingRow: {
    marginTop: 12
  },
  priceContainer: {
    marginTop: 16
  },
  paystackHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4
  },
  pickerSection: {
    marginTop: 24
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10
  },
  toastBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(23, 23, 23, 0.08)",
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md
  },
  toastText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "600"
  },
  ctaWrapper: {
    marginTop: 28,
    gap: 12
  },
  addBagBtn: {
    backgroundColor: colors.accent,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center"
  },
  addBagText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600"
  },
  buyNowBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.accent,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center"
  },
  buyNowText: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "600"
  },
  detailsBlock: {
    marginTop: 32
  },
  blockTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: colors.text,
    marginBottom: 12
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  specKey: {
    fontSize: 14,
    color: colors.textSecondary
  },
  specValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right"
  },
  descBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginTop: 4
  },
  readMoreText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600"
  },
  reviewSummaryRow: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "center",
    marginTop: 8
  },
  summaryLeft: {
    alignItems: "center"
  },
  bigRatingText: {
    fontSize: 48,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 52
  },
  summaryTotalText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4
  },
  summaryRight: {
    flex: 1,
    gap: 4
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  starNumText: {
    fontSize: 11,
    color: colors.textSecondary,
    width: 20
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.star,
    borderRadius: 3
  },
  reviewsList: {
    marginTop: spacing.md
  },
  reviewCard: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  reviewItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: 6
  },
  reviewItemBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    marginTop: 4
  },
  relatedSection: {
    marginTop: spacing.xl
  },
  relatedListContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md - 4
  },
  stickyBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    ...shadow.soft,
    zIndex: 30
  },
  stickyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2
  },
  stickyThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.imageBg
  },
  stickyThumbFallback: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: "hidden"
  },
  stickyMeta: {
    maxWidth: 140
  },
  stickyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  stickyCta: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill
  },
  stickyCtaText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600"
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background
  },
  errorTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md
  },
  errorSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs
  },
  backBtnPill: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.pill,
    marginTop: spacing.lg
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600"
  },
  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs
  },
  writeReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 980,
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  writeReviewText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "600"
  },
  noReviewsText: {
    ...typography.bodySmall,
    marginTop: spacing.md
  },
  sheetRoot: {
    flex: 1,
    backgroundColor: colors.background
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm
  },
  sheetCancelText: {
    ...typography.body,
    color: colors.textSecondary
  },
  sheetTitle: {
    ...typography.headline,
    fontWeight: "600"
  },
  sheetContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl
  },
  sheetProductName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg
  },
  sheetLabel: {
    ...typography.subheadline,
    fontWeight: "600",
    marginTop: spacing.lg,
    marginBottom: spacing.sm
  },
  starRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  sheetInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    ...typography.body,
    color: colors.text
  },
  sheetBodyInput: {
    minHeight: 130,
    paddingTop: 14
  },
  sheetSubmitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    minHeight: 52
  },
  sheetSubmitText: {
    ...typography.headline,
    color: "#FFFFFF",
    fontWeight: "700"
  }
});
