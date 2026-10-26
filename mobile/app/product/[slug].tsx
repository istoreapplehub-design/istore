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
  View,
  useWindowDimensions
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
import { createReview, getProduct, getProducts, getReviews } from "../../services/api";
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

const IMAGE_CAROUSEL_HEIGHT = 420;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const isDesktopOrTablet = width >= 860;
  const carouselWidth = isDesktopOrTablet ? Math.min(width * 0.45, 520) : Math.min(width, 820);

  const [product, setProduct] = useState<Product | null>(null);
  const [compatibleAccessories, setCompatibleAccessories] = useState<Product[]>([]);
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
  const [guestReviewName, setGuestReviewName] = useState("");
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

      getProducts({ category: "Accessories", limit: 8 })
        .then((accRes) => {
          setCompatibleAccessories(
            (accRes.data || []).filter((item) => item.id !== data.id).slice(0, 6)
          );
        })
        .catch(() => {});
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
      ? product.colors?.find(
          (c) => c.name.trim().toLowerCase() === selectedColor.trim().toLowerCase()
        )
      : undefined;

    let colorImgs: string[] = [];
    if (Array.isArray(colorObj?.images) && colorObj.images.length > 0) {
      colorImgs = colorObj.images;
    } else if ((colorObj as any)?.image && typeof (colorObj as any).image === "string") {
      colorImgs = [(colorObj as any).image];
    }

    const raw = colorImgs.length > 0 ? colorImgs : product.images || [];
    return raw.filter((url) => url && !url.includes("placehold.co"));
  }, [product, selectedColor]);

  // When color changes, reset image carousel to first slide
  useEffect(() => {
    setActiveImageIndex(0);
    imageFlatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [selectedColor, activeImages]);

  const storageOptions = useMemo(() => {
    if (!product) return [];
    if (product.storage) {
      if (product.category === "iPhone" || product.category === "iPad" || product.category === "Mac") {
        const tiers = ["128GB", "256GB", "512GB", "1TB", "2TB"];
        const idx = tiers.indexOf(product.storage);
        return idx >= 0 ? tiers.slice(idx) : [product.storage];
      }
      return [product.storage];
    }
    return [];
  }, [product]);

  // Dynamically update displayed price when customer selects a higher storage variant
  const effectivePriceGHS = useMemo(() => {
    if (!product) return 0;
    const tiers = ["128GB", "256GB", "512GB", "1TB", "2TB"];
    const baseIdx = product.storage ? tiers.indexOf(product.storage) : -1;
    const selIdx = selectedStorage ? tiers.indexOf(selectedStorage) : -1;
    if (baseIdx >= 0 && selIdx > baseIdx) {
      const steps = selIdx - baseIdx;
      return product.priceGHS + steps * 2200;
    }
    return product.priceGHS;
  }, [product, selectedStorage]);

  const effectiveCompareAtPriceGHS = useMemo(() => {
    if (!product?.compareAtPriceGHS) return null;
    const diff = effectivePriceGHS - product.priceGHS;
    return product.compareAtPriceGHS + diff;
  }, [product, effectivePriceGHS]);

  const isOutOfStock = product ? product.stock <= 0 : false;

  const handleAddToCart = () => {
    if (!product || addingToCart || product.stock <= 0) return;
    setAddingToCart(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    cartAddItem({
      productId: product.id,
      name: product.name,
      priceGHS: effectivePriceGHS,
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
    if (!product || product.stock <= 0) return;
    handleAddToCart();
    router.push("/checkout");
  };

  const handleSubmitReview = async () => {
    if (!product) return;

    const author = (userId ? userName : guestReviewName.trim()) || "Guest Customer";
    if (!userId && guestReviewName.trim().length < 2) {
      Alert.alert("Name Required", "Please enter your name to post a review.");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await createReview(
        product.slug,
        {
          rating: reviewRating,
          title: reviewTitle.trim(),
          body: reviewBody.trim(),
          authorName: author
        },
        userId || undefined
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
      setGuestReviewName("");
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
        message: `Check out the ${product.name} at I-Dynamic: ₵${effectivePriceGHS.toLocaleString("en-GH")}`
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
        <SkeletonLoader width={carouselWidth} height={420} radius={0} />
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
        <View style={styles.navBarInner}>
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
        </View>
      </Animated.View>

      {/* ─── MAIN CONTENT SCROLLER ──────────────────────────────────────── */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* ─── 2. PRODUCT MAIN CONTENT (Responsive Split on Desktop/Tablet) ── */}
        <View style={[styles.mainLayout, isDesktopOrTablet && styles.desktopSplitLayout]}>
          {/* Left: Product Media Gallery */}
          <View style={[styles.carouselCol, isDesktopOrTablet && styles.desktopCarouselCol]}>
            <View style={[styles.carouselContainer, { width: carouselWidth, alignSelf: "center" }]}>
          {activeImages.length === 0 ? (
            <View style={[styles.imageSlide, { width: carouselWidth }]}>
              <ProductVisual category={product.category} glyphSize={110} />
            </View>
          ) : (
            <>
              <FlatList
                ref={imageFlatListRef}
                horizontal
                pagingEnabled
                snapToInterval={carouselWidth}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                data={activeImages}
                keyExtractor={(_, index) => `img-${index}`}
                onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                  const offsetX = e.nativeEvent.contentOffset.x;
                  const idx = Math.round(offsetX / carouselWidth);
                  setActiveImageIndex(idx);
                }}
                renderItem={({ item, index }) => (
                  <View style={[styles.imageSlide, { width: carouselWidth }]}>
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

            {/* Apple AR Quick Look button */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push({
                  pathname: "/ar-viewer",
                  params: { model: product.slug, color: selectedColor }
                } as any);
              }}
              style={({ pressed }) => [
                styles.arQuickLookBtn,
                pressed && { opacity: 0.8 }
              ]}
            >
              <Ionicons name="cube-outline" size={17} color="#0066CC" />
              <Text style={styles.arQuickLookBtnText}>View in your space (3D · AR)</Text>
            </Pressable>
          </View>

          {/* Right: Product Details, Config & CTA */}
          <View style={[styles.infoCol, isDesktopOrTablet && styles.desktopInfoCol]}>
            <View style={[styles.infoContainer, isDesktopOrTablet && { paddingHorizontal: 0, paddingTop: 0 }]}>
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
              price={effectivePriceGHS}
              compareAt={effectiveCompareAtPriceGHS}
              size="lg"
            />
            <Text style={styles.paystackHint}>
              MTN MoMo, Telecel Cash, AT Money or card via Paystack
            </Text>
          </View>

          {/* Apple Trade In Banner */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/trade-in" as any);
            }}
            style={({ pressed }) => [
              styles.tradeInBanner,
              pressed && { opacity: 0.85 }
            ]}
          >
            <View style={styles.tradeInIconBox}>
              <Ionicons name="repeat" size={16} color="#0066CC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tradeInTitle}>Apple Trade In</Text>
              <Text style={styles.tradeInSub}>
                Get up to ₵19,500 credit toward this {product.category}. Instant valuation with your serial number.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#0066CC" />
          </Pressable>

          {/* Stock Availability, Delivery Estimate & Warranty Summary */}
          <View style={styles.assuranceSummaryCard}>
            <View style={styles.assuranceItemRow}>
              <Ionicons
                name={isOutOfStock ? "close-circle-outline" : "checkmark-circle"}
                size={18}
                color={isOutOfStock ? colors.danger : colors.brandAccent}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.assuranceItemTitle}>
                  {isOutOfStock
                    ? "Out of Stock"
                    : product.stock <= 5
                    ? `Low Stock · Only ${product.stock} left`
                    : `In Stock · ${product.stock} units ready to ship`}
                </Text>
                <Text style={styles.assuranceItemSub}>
                  {product.condition || "New"} · Factory-sealed original box
                </Text>
              </View>
            </View>

            <View style={styles.assuranceDivider} />

            <View style={styles.assuranceItemRow}>
              <Ionicons name="bicycle-outline" size={18} color={colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={styles.assuranceItemTitle}>Delivery Estimate</Text>
                <Text style={styles.assuranceItemSub}>
                  Same-day express in Accra · 1–3 working days nationwide · Free 1-hr Showroom Pickup
                </Text>
              </View>
            </View>

            <View style={styles.assuranceDivider} />

            <Pressable
              style={styles.assuranceItemRow}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/warranty" as never);
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={styles.assuranceItemTitle}>
                  {product.warranty || "1 Year Official Apple Warranty"} & 7-Day Returns
                </Text>
                <Text style={styles.assuranceItemSub}>
                  Tap for warranty verification & return policy details
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
            </Pressable>
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
              accessibilityLabel={
                isOutOfStock
                  ? "Out of Stock"
                  : addedSuccess
                  ? "Added to Bag"
                  : "Add to Bag"
              }
              disabled={addingToCart || isOutOfStock}
              style={[
                styles.addBagBtn,
                addedSuccess && { backgroundColor: colors.success },
                (addingToCart || isOutOfStock) && { opacity: 0.5 }
              ]}
              onPress={handleAddToCart}
            >
              <Text style={styles.addBagText}>
                {isOutOfStock
                  ? "Out of Stock"
                  : addedSuccess
                  ? "✓ Added to Bag"
                  : "Add to Bag"}
              </Text>
            </Pressable>

            {!isOutOfStock && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Buy Now"
                style={styles.buyNowBtn}
                onPress={handleBuyNow}
              >
                <Text style={styles.buyNowText}>Buy Now</Text>
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isWishlisted ? "Remove from Favorites" : "Save to Favorites"}
              style={[styles.wishlistCtaBtn, isWishlisted && styles.wishlistCtaBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleWishlist(product.id);
              }}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={20}
                color={isWishlisted ? colors.brandRed : colors.text}
              />
              <Text style={[styles.wishlistCtaText, isWishlisted && styles.wishlistCtaTextActive]}>
                {isWishlisted ? "Saved to Favorites" : "Save to Favorites"}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Compare with other models"
              style={styles.compareCtaBtn}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/compare?base=${encodeURIComponent(product.slug)}` as never);
              }}
            >
              <Ionicons name="git-compare-outline" size={18} color={colors.text} />
              <Text style={styles.compareCtaText}>Compare with Other Models</Text>
            </Pressable>
          </View>

          {/* ─── 6B. KEY PRODUCT FEATURES ───────────────────────────────── */}
          <View style={styles.detailsBlock}>
            <Text style={styles.blockTitle}>Key Features</Text>
            <View style={styles.featuresList}>
              {[
                product.specs?.chip && `Powered by ${product.specs.chip}`,
                product.specs?.display && `Display: ${product.specs.display}`,
                product.specs?.camera && `Camera system: ${product.specs.camera}`,
                product.specs?.battery && `Battery: ${product.specs.battery}`,
                `${product.condition || "New"} condition with ${product.warranty || "1 Year Official Apple Warranty"}`
              ]
                .filter(Boolean)
                .map((feat, idx) => (
                  <View key={idx} style={styles.featureBulletRow}>
                    <Ionicons name="checkmark-circle-outline" size={17} color={colors.brandAccent} />
                    <Text style={styles.featureBulletText}>{feat}</Text>
                  </View>
                ))}
            </View>
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
        </View>
        </View>

        {/* ─── 10. COMPATIBLE ACCESSORIES & RELATED ────────────────────────── */}
        <View style={[styles.bottomSection, isDesktopOrTablet && styles.desktopBottomSection]}>
          {compatibleAccessories.length > 0 && product.category !== "Accessories" && (
            <View style={styles.relatedSection}>
              <SectionHeader
                title="Compatible Accessories"
                subtitle="Cases, MagSafe chargers & essentials designed to pair"
                onSeeAll={() => router.push("/(tabs)/shop?category=Accessories")}
              />
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={compatibleAccessories}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.relatedListContent}
                renderItem={({ item }) => (
                  <ProductCard product={item} variant="grid" />
                )}
              />
            </View>
          )}

          {product.relatedProducts && product.relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <SectionHeader title="Related Products" />
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
        </View>
      </Animated.ScrollView>

      {/* ─── 11. STICKY BOTTOM BAR (APP STORE STYLE - Mobile Only) ──────── */}
      {!isDesktopOrTablet && (
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
              <PriceTag price={effectivePriceGHS} size="sm" />
            </View>
          </View>

          <View style={styles.stickyRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              style={[styles.stickyWishlistBtn, isWishlisted && styles.stickyWishlistBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleWishlist(product.id);
              }}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={20}
                color={isWishlisted ? colors.brandRed : colors.text}
              />
            </Pressable>

            <Pressable
              style={[styles.stickyCta, isOutOfStock && { opacity: 0.5 }]}
              disabled={isOutOfStock}
              onPress={handleAddToCart}
            >
              <Text style={styles.stickyCtaText}>
                {isOutOfStock ? "Out of Stock" : "Add to Bag"}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

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

            {!userId && (
              <>
                <Text style={styles.sheetLabel}>Your Name</Text>
                <TextInput
                  style={styles.sheetInput}
                  placeholder="e.g. Kwame Mensah"
                  placeholderTextColor={colors.textTertiary}
                  value={guestReviewName}
                  onChangeText={setGuestReviewName}
                  maxLength={50}
                />
              </>
            )}

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
                (submittingReview ||
                  reviewTitle.trim().length < 3 ||
                  reviewBody.trim().length < 10 ||
                  (!userId && guestReviewName.trim().length < 2)) && { opacity: 0.5 },
                pressed && { transform: [{ scale: 0.99 }] }
              ]}
              disabled={
                submittingReview ||
                reviewTitle.trim().length < 3 ||
                reviewBody.trim().length < 10 ||
                (!userId && guestReviewName.trim().length < 2)
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
    paddingHorizontal: spacing.md
  },
  navBarInner: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
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
  mainLayout: {
    width: "100%"
  },
  desktopSplitLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    gap: 40,
    marginTop: 20
  },
  carouselCol: {
    width: "100%"
  },
  desktopCarouselCol: {
    flex: 1,
    maxWidth: 540,
    alignItems: "center"
  },
  infoCol: {
    width: "100%"
  },
  desktopInfoCol: {
    flex: 1.25
  },
  bottomSection: {
    width: "100%"
  },
  desktopBottomSection: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    marginTop: 24
  },
  carouselContainer: {
    height: IMAGE_CAROUSEL_HEIGHT,
    backgroundColor: "#FFFFFF",
    position: "relative",
    overflow: "hidden"
  },
  imageSlide: {
    height: IMAGE_CAROUSEL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    backgroundColor: "#FFFFFF",
    overflow: "hidden"
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
    width: 20,
    backgroundColor: colors.brandRed
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
    fontWeight: "800",
    color: colors.brandRed
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
    backgroundColor: colors.brandRedSoft,
    borderWidth: 1,
    borderColor: colors.brandRedBorder,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md
  },
  toastText: {
    color: colors.brandRed,
    fontSize: 14,
    fontWeight: "700"
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
    backgroundColor: colors.brandRed,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brandRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  buyNowText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700"
  },
  wishlistCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: "#F5F5F7",
    borderWidth: 1,
    borderColor: "#E5E5EA"
  },
  wishlistCtaBtnActive: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3"
  },
  wishlistCtaText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text
  },
  wishlistCtaTextActive: {
    color: colors.brandRed,
    fontWeight: "700"
  },
  compareCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border
  },
  compareCtaText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  },
  assuranceSummaryCard: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10
  },
  assuranceItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  assuranceItemTitle: {
    fontSize: 13.5,
    fontWeight: "600",
    color: colors.text
  },
  assuranceItemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1
  },
  assuranceDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border
  },
  featuresList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  featureBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  featureBulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text
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
  stickyRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  stickyWishlistBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA"
  },
  stickyWishlistBtnActive: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3"
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
  },
  arQuickLookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 102, 204, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1
  },
  arQuickLookBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semibold,
    color: "#0066CC"
  },
  tradeInBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(0, 102, 204, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 102, 204, 0.18)",
    borderRadius: radius.md,
    padding: 12,
    marginTop: 14,
    marginBottom: 4
  },
  tradeInIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 102, 204, 0.2)"
  },
  tradeInTitle: {
    fontSize: 13.5,
    fontFamily: typography.fontFamily.bold,
    color: colors.text
  },
  tradeInSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 15,
    marginTop: 1
  }
});
