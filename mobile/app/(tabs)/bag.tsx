/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on stepper [+/-]
 * - Haptics.impactAsync("light") on edit toggle, promo apply, and empty state button
 * - Haptics.impactAsync("medium") on remove item, wishlist toggle, and checkout button
 * - Haptics.notificationAsync("success") on promo applied or item added to bag
 */
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { useCartStore } from "../../store/useCartStore";
import { useWishlistStore } from "../../store/useWishlistStore";
import { colors, formatGHS, radius, spacing, typography } from "../../constants/theme";
import PriceTag from "../../components/PriceTag";
import { ProductVisual, getStoredImage } from "../../components/ProductVisual";
import { CATALOG_2026 } from "../../constants/catalog2026";
import { Product } from "../../types";

export default function BagScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTabletOrPc = width >= 860;
  const [editMode, setEditMode] = useState(false);

  // Cart & Wishlist state
  const { items, updateQty, removeItem, clearCart, getSubtotalGHS, addItem } = useCartStore();
  const { toggle: toggleWishlist, isWishlisted } = useWishlistStore();
  const subtotalGHS = getSubtotalGHS();
  const totalItemCount = items.reduce((sum, i) => sum + i.qty, 0);

  // Promo code state
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);

  // Recommended accessories (accessories from catalog that aren't already in the bag)
  const cartProductIds = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  const recommendedAccessories = useMemo(() => {
    return CATALOG_2026.filter((p) => p.category === "Accessories" && !cartProductIds.has(p.id)).slice(0, 6);
  }, [cartProductIds]);

  // Featured flagships for empty state
  const popularFlagships = useMemo(() => {
    return CATALOG_2026.slice(0, 4);
  }, []);

  const discountAmount = appliedPromo
    ? Math.round((subtotalGHS * appliedPromo.percent) / 100)
    : 0;
  const finalTotalGHS = Math.max(0, subtotalGHS - discountAmount);

  const handleStartShopping = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)");
  };

  const handleGoToDeals = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/deals" as any);
  };

  const handleToggleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditMode(!editMode);
  };

  const handleClearBag = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Clear Bag", "Are you sure you want to remove all items from your bag?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          clearCart();
          setEditMode(false);
          setAppliedPromo(null);
        }
      }
    ]);
  };

  const handleApplyPromo = () => {
    const clean = promoCodeInput.trim().toUpperCase();
    if (!clean) return;

    if (clean === "IDYNAMIC10" || clean === "APPLEGH" || clean === "WELCOME10" || clean === "VIP10") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAppliedPromo({ code: clean, percent: 10 });
      setPromoSuccessMsg("10% discount applied to your order!");
      setPromoError(null);
      setPromoCodeInput("");
    } else if (clean === "IDYNAMIC5" || clean === "SAVE5") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAppliedPromo({ code: clean, percent: 5 });
      setPromoSuccessMsg("5% discount applied to your order!");
      setPromoError(null);
      setPromoCodeInput("");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setPromoError("Promo code is invalid or has expired.");
      setPromoSuccessMsg(null);
    }
  };

  const handleRemovePromo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppliedPromo(null);
    setPromoSuccessMsg(null);
    setPromoError(null);
  };

  const handleSaveForLater = (productId: string, productName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleWishlist(productId);
    const inWishlist = !isWishlisted(productId);
    Alert.alert(
      inWishlist ? "Saved to Wishlist" : "Removed from Wishlist",
      `${productName} has been ${inWishlist ? "added to" : "removed from"} your saved items.`
    );
  };

  const handleAddRecommended = (product: Product) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const color = product.colors && product.colors.length > 0 ? product.colors[0].name : undefined;
    const imgUrl = product.images && product.images.length > 0 ? product.images[0] : "";
    addItem({
      productId: product.id,
      name: product.name,
      priceGHS: product.priceGHS,
      image: imgUrl,
      color,
      storage: product.storage || undefined,
      qty: 1
    });
  };

  const handleHelpPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "I-Dynamic Specialist Support",
      "Need advice choosing finishes, configurations, or checking delivery times?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "WhatsApp Specialist",
          onPress: () => {
            Linking.openURL("https://wa.me/233240000000?text=Hello%20I-Dynamic,%20I%20need%20help%20with%20my%20order");
          }
        },
        {
          text: "Call Store",
          onPress: () => {
            Linking.openURL("tel:+233240000000");
          }
        }
      ]
    );
  };

  const handleCheckout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/checkout");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerEyebrow}>I-DYNAMIC STORE</Text>
            <Text style={styles.headerTitle}>Review your Bag.</Text>
            <Text style={styles.headerSubtitle}>
              {totalItemCount === 0
                ? "Review items in your bag."
                : `${totalItemCount} ${totalItemCount === 1 ? "item" : "items"}`}
            </Text>
          </View>

          {items.length > 0 && (
            <View style={styles.headerActionRow}>
              {editMode && (
                <Pressable
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={handleClearBag}
                  style={({ pressed }) => [styles.clearBagBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.clearBagText}>Clear All</Text>
                </Pressable>
              )}
              <Pressable
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={handleToggleEdit}
                style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.editText}>{editMode ? "Done" : "Edit"}</Text>
              </Pressable>
              <Pressable
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={handleHelpPress}
                style={({ pressed }) => [styles.helpBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.brandAccent} />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* 2. Empty State */}
      {items.length === 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.emptyScrollContent}
        >
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="bag-handle-outline" size={54} color={colors.text} />
            </View>
            <Text style={styles.emptyTitle}>Your Bag is empty.</Text>
            <Text style={styles.emptySubtitle}>
              Explore our latest 2026 flagship lineup, authenticated accessories, and limited flash deals with 1-Year Apple warranty coverage.
            </Text>

            <View style={styles.emptyButtonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.startShoppingBtn,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }
                ]}
                onPress={handleStartShopping}
              >
                <Text style={styles.startShoppingText}>Shop 2026 Flagships</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.emptyDealsBtn,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
                ]}
                onPress={handleGoToDeals}
              >
                <Ionicons name="flash-outline" size={16} color={colors.brandAccent} style={{ marginRight: 6 }} />
                <Text style={styles.emptyDealsText}>Flash Deals</Text>
              </Pressable>
            </View>
          </View>

          {/* Popular Right Now Preview */}
          <View style={styles.emptyPopularSection}>
            <View style={styles.emptyPopularHeader}>
              <Text style={styles.emptyPopularTitle}>Popular Right Now</Text>
              <Pressable onPress={handleStartShopping}>
                <Text style={styles.emptyPopularSeeAll}>See all</Text>
              </Pressable>
            </View>

            <View style={styles.emptyPopularGrid}>
              {popularFlagships.map((prod) => {
                const thumb = getStoredImage(prod.images?.[0]);
                return (
                  <Pressable
                    key={prod.id}
                    style={({ pressed }) => [
                      styles.emptyPopularCard,
                      isTabletOrPc && { width: "23.5%" },
                      pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push(`/product/${prod.slug}`);
                    }}
                  >
                    <View style={styles.emptyPopularImageWrapper}>
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={styles.emptyPopularImage} resizeMode="contain" />
                      ) : (
                        <ProductVisual category={prod.category} glyphSize={28} />
                      )}
                    </View>
                    <Text style={styles.emptyPopularName} numberOfLines={2}>
                      {prod.name}
                    </Text>
                    <Text style={styles.emptyPopularPrice}>{formatGHS(prod.priceGHS)}</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.emptyAddBtn,
                        pressed && { opacity: 0.75 }
                      ]}
                      onPress={() => handleAddRecommended(prod)}
                    >
                      <Text style={styles.emptyAddBtnText}>+ Add to Bag</Text>
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      ) : (
        /* 3. Items List + Summary */
        <View style={styles.contentWrapper}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              isTabletOrPc && styles.desktopScrollContent
            ]}
          >
            <View style={[styles.mainLayout, isTabletOrPc && styles.desktopLayout]}>
              {/* Left Column (Items & Recommended) */}
              <View style={[styles.leftCol, isTabletOrPc && styles.desktopLeftCol]}>
                {/* Cart Items List */}
                <View style={[styles.itemsListContainer, isTabletOrPc && { marginHorizontal: 0 }]}>
                  {items.map((item, index) => {
                    const thumb = getStoredImage(item.image);
                    const isLast = index === items.length - 1;
                    const wishlisted = isWishlisted(item.productId);

                    return (
                      <Animated.View
                        key={`${item.productId}-${item.color || ""}-${item.storage || ""}`}
                        layout={Layout.springify()}
                        entering={FadeIn}
                        exiting={FadeOut.duration(200)}
                        style={[styles.itemCard, !isLast && styles.itemBorderBottom]}
                      >
                        {/* Thumbnail Container */}
                        <Pressable
                          onPress={() => {
                            Haptics.selectionAsync();
                            // Find matching slug if available
                            const match = CATALOG_2026.find((c) => c.id === item.productId || c.name === item.name);
                            if (match) router.push(`/product/${match.slug}`);
                          }}
                          style={styles.itemImageWrapper}
                        >
                          {thumb ? (
                            <Image
                              source={{ uri: thumb }}
                              style={styles.itemImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={styles.itemImageFallback}>
                              <ProductVisual glyphSize={32} />
                            </View>
                          )}
                        </Pressable>

                        {/* Details Column */}
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemName} numberOfLines={2}>
                            {item.name}
                          </Text>

                          {/* Specs / Finish chips */}
                          <View style={styles.specsRow}>
                            {item.color ? (
                              <View style={styles.specChip}>
                                <View style={styles.colorDot} />
                                <Text style={styles.specChipText}>{item.color}</Text>
                              </View>
                            ) : null}

                            {item.storage ? (
                              <View style={styles.specChip}>
                                <Text style={styles.specChipText}>{item.storage}</Text>
                              </View>
                            ) : null}
                          </View>

                          {/* Price Display */}
                          <View style={styles.priceContainer}>
                            <PriceTag price={item.priceGHS} size="md" />
                          </View>

                          {/* Controls Row: Stepper + Quick Actions */}
                          <View style={styles.controlsRow}>
                            {/* Stepper */}
                            <View style={styles.stepperContainer}>
                              <Pressable
                                disabled={item.qty <= 1}
                                style={({ pressed }) => [
                                  styles.stepperBtn,
                                  item.qty <= 1 && styles.stepperBtnDisabled,
                                  pressed && item.qty > 1 && { opacity: 0.6 }
                                ]}
                                onPress={() => {
                                  if (item.qty > 1) {
                                    Haptics.selectionAsync();
                                    updateQty(
                                      item.productId,
                                      item.qty - 1,
                                      item.color,
                                      item.storage
                                    );
                                  }
                                }}
                              >
                                <Ionicons
                                  name="remove"
                                  size={15}
                                  color={item.qty <= 1 ? colors.textTertiary : colors.text}
                                />
                              </Pressable>

                              <Text style={styles.stepperQty}>{item.qty}</Text>

                              <Pressable
                                disabled={item.qty >= 10}
                                style={({ pressed }) => [
                                  styles.stepperBtn,
                                  item.qty >= 10 && styles.stepperBtnDisabled,
                                  pressed && item.qty < 10 && { opacity: 0.6 }
                                ]}
                                onPress={() => {
                                  if (item.qty < 10) {
                                    Haptics.selectionAsync();
                                    updateQty(
                                      item.productId,
                                      item.qty + 1,
                                      item.color,
                                      item.storage
                                    );
                                  }
                                }}
                              >
                                <Ionicons
                                  name="add"
                                  size={15}
                                  color={item.qty >= 10 ? colors.textTertiary : colors.text}
                                />
                              </Pressable>
                            </View>

                            {/* Save for later & Remove micro-actions */}
                            <View style={styles.itemMicroActions}>
                              <Pressable
                                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                                style={({ pressed }) => [styles.microActionBtn, pressed && { opacity: 0.6 }]}
                                onPress={() => handleSaveForLater(item.productId, item.name)}
                              >
                                <Ionicons
                                  name={wishlisted ? "heart" : "heart-outline"}
                                  size={18}
                                  color={wishlisted ? "#E11D48" : colors.textSecondary}
                                />
                              </Pressable>

                              <Pressable
                                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                                style={({ pressed }) => [
                                  styles.microActionBtn,
                                  editMode && styles.microActionBtnEdit,
                                  pressed && { opacity: 0.6 }
                                ]}
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                  removeItem(item.productId, item.color, item.storage);
                                }}
                              >
                                <Ionicons
                                  name={editMode ? "trash" : "trash-outline"}
                                  size={18}
                                  color={editMode ? "#DC2626" : colors.textSecondary}
                                />
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>

                {/* 4. Recommended Add-Ons Carousel */}
                {recommendedAccessories.length > 0 && (
                  <View style={[styles.recommendedSection, isTabletOrPc && { paddingHorizontal: 0 }]}>
                    <View style={styles.recommendedHeader}>
                      <View>
                        <Text style={styles.recommendedEyebrow}>FREQUENTLY BOUGHT TOGETHER</Text>
                        <Text style={styles.recommendedTitle}>Add the perfect companion.</Text>
                      </View>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.recommendedScroll}
                    >
                      {recommendedAccessories.map((acc) => {
                        const accThumb = getStoredImage(acc.images?.[0]);
                        return (
                          <View key={acc.id} style={styles.recommendedCard}>
                            <View style={styles.recommendedImageWrapper}>
                              {accThumb ? (
                                <Image
                                  source={{ uri: accThumb }}
                                  style={styles.recommendedImage}
                                  resizeMode="contain"
                                />
                              ) : (
                                <ProductVisual category="accessories" glyphSize={30} />
                              )}
                            </View>

                            <Text style={styles.recommendedItemName} numberOfLines={2}>
                              {acc.name}
                            </Text>
                            <Text style={styles.recommendedItemPrice}>{formatGHS(acc.priceGHS)}</Text>

                            <Pressable
                              style={({ pressed }) => [
                                styles.recommendedAddBtn,
                                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                              ]}
                              onPress={() => handleAddRecommended(acc)}
                            >
                              <Ionicons name="add" size={14} color="#FFFFFF" style={{ marginRight: 2 }} />
                              <Text style={styles.recommendedAddBtnText}>Add</Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Right Column (Summary, Promo, Assurances) */}
              <View style={[styles.rightCol, isTabletOrPc && styles.desktopRightCol]}>
                {/* 5. Promo Code Voucher Section */}
                <View style={[styles.promoSection, isTabletOrPc && { marginHorizontal: 0, marginTop: 14 }]}>
                  <Text style={styles.promoTitle}>Have a promo code?</Text>
                  {appliedPromo ? (
                    <View style={styles.appliedPromoCard}>
                      <View style={styles.appliedPromoLeft}>
                        <Ionicons name="pricetag" size={18} color="#059669" />
                        <View style={{ marginLeft: 10 }}>
                          <Text style={styles.appliedPromoCode}>{appliedPromo.code}</Text>
                          <Text style={styles.appliedPromoDetail}>
                            {appliedPromo.percent}% discount applied (-{formatGHS(discountAmount)})
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={handleRemovePromo}
                        style={({ pressed }) => [styles.removePromoBtn, pressed && { opacity: 0.6 }]}
                      >
                        <Ionicons name="close" size={18} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  ) : (
                    <View>
                      <View style={styles.promoInputRow}>
                        <TextInput
                          style={styles.promoInput}
                          placeholder="e.g. IDYNAMIC10, WELCOME10"
                          placeholderTextColor={colors.textTertiary}
                          value={promoCodeInput}
                          onChangeText={(val) => {
                            setPromoCodeInput(val);
                            if (promoError) setPromoError(null);
                          }}
                          autoCapitalize="characters"
                          autoCorrect={false}
                        />
                        <Pressable
                          style={({ pressed }) => [
                            styles.promoApplyBtn,
                            !promoCodeInput.trim() && styles.promoApplyBtnDisabled,
                            pressed && { opacity: 0.8 }
                          ]}
                          disabled={!promoCodeInput.trim()}
                          onPress={handleApplyPromo}
                        >
                          <Text style={styles.promoApplyBtnText}>Apply</Text>
                        </Pressable>
                      </View>
                      {promoError ? (
                        <Text style={styles.promoErrorText}>{promoError}</Text>
                      ) : null}
                      {promoSuccessMsg ? (
                        <Text style={styles.promoSuccessText}>{promoSuccessMsg}</Text>
                      ) : null}
                    </View>
                  )}
                </View>

                {/* 6. Order Summary Card */}
                <View style={[styles.summaryCard, isTabletOrPc && { marginHorizontal: 0, marginTop: 16 }]}>
                  <Text style={styles.summaryCardHeader}>Order Summary</Text>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>{formatGHS(subtotalGHS)}</Text>
                  </View>

                  <View style={[styles.summaryRow, { marginTop: 12 }]}>
                    <Text style={styles.summaryLabel}>Shipping & Handling</Text>
                    <View style={styles.freeShippingBadge}>
                      <Text style={styles.freeShippingText}>FREE</Text>
                    </View>
                  </View>

                  <View style={[styles.summaryRow, { marginTop: 12 }]}>
                    <Text style={styles.summaryLabel}>Estimated VAT / Tax</Text>
                    <Text style={styles.summaryTaxIncluded}>Included</Text>
                  </View>

                  {appliedPromo && (
                    <View style={[styles.summaryRow, { marginTop: 12 }]}>
                      <Text style={styles.summaryDiscountLabel}>
                        Discount ({appliedPromo.code})
                      </Text>
                      <Text style={styles.summaryDiscountValue}>
                        -{formatGHS(discountAmount)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryTotalLabel}>Total</Text>
                    <Text style={styles.summaryTotalValue}>
                      {formatGHS(finalTotalGHS)}
                    </Text>
                  </View>

                  <Text style={styles.summaryNote}>
                    Prices in Ghanaian Cedis (GHS). Includes all Apple warranties, transit insurance, and complimentary delivery.
                  </Text>

                  {/* Desktop / Tablet Direct Checkout Button */}
                  {isTabletOrPc && (
                    <View style={styles.desktopCheckoutBox}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.checkoutBtn,
                          styles.desktopCheckoutBtn,
                          pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={handleCheckout}
                      >
                        <Text style={styles.checkoutBtnText}>Check Out</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* 8. Sticky Bottom Checkout Bar (Mobile Only) */}
          {!isTabletOrPc && (
            <View
              style={[
                styles.stickyBar,
                { paddingBottom: Math.max(insets.bottom, 16) }
              ]}
            >
              <View style={styles.stickyBarTop}>
                <View style={styles.stickyPriceCol}>
                  <Text style={styles.stickyTotalLabel}>Total</Text>
                  <Text style={styles.stickyTotalPrice}>
                    {formatGHS(finalTotalGHS)}
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.checkoutBtn,
                    pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }
                  ]}
                  onPress={handleCheckout}
                >
                  <Text style={styles.checkoutBtnText}>Check Out</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBFBFD"
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center"
  },
  headerTitleCol: {
    flex: 1,
    paddingRight: 10
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginBottom: 2
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: colors.text
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18
  },
  headerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6
  },
  clearBagBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: "rgba(220, 38, 38, 0.08)"
  },
  clearBagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DC2626"
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  editText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.brandAccent
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 102, 204, 0.08)",
    alignItems: "center",
    justifyContent: "center"
  },

  // Empty state
  emptyScrollContent: {
    paddingBottom: 40
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 32
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA"
  },
  emptyTitle: {
    ...typography.h2,
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    marginTop: 20
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 320
  },
  emptyButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 26
  },
  startShoppingBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 14
  },
  startShoppingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600"
  },
  emptyDealsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  emptyDealsText: {
    color: colors.brandAccent,
    fontSize: 15,
    fontWeight: "600"
  },
  emptyPopularSection: {
    marginTop: 16,
    paddingHorizontal: 18
  },
  emptyPopularHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 2
  },
  emptyPopularTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  emptyPopularSeeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brandAccent
  },
  emptyPopularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12
  },
  emptyPopularCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  emptyPopularImageWrapper: {
    width: "100%",
    height: 120,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  emptyPopularImage: {
    width: "90%",
    height: "90%"
  },
  emptyPopularName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 18,
    minHeight: 36
  },
  emptyPopularPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4
  },
  emptyAddBtn: {
    marginTop: 8,
    backgroundColor: "#F5F5F7",
    paddingVertical: 7,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text
  },

  // Main Cart Content
  contentWrapper: {
    flex: 1,
    position: "relative"
  },
  scrollContent: {
    paddingBottom: 170
  },
  desktopScrollContent: {
    paddingBottom: 60
  },
  mainLayout: {
    width: "100%"
  },
  desktopLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    gap: 32
  },
  leftCol: {
    width: "100%"
  },
  desktopLeftCol: {
    flex: 1.35
  },
  rightCol: {
    width: "100%"
  },
  desktopRightCol: {
    width: 380,
    maxWidth: 400
  },
  desktopCheckoutBox: {
    marginTop: 20
  },
  desktopCheckoutBtn: {
    width: "100%",
    justifyContent: "center"
  },

  // Fulfillment Banner
  fulfillmentBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  fulfillmentItem: {
    flexDirection: "row",
    alignItems: "center"
  },
  fulfillmentIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  fulfillmentTextCol: {
    flex: 1
  },
  fulfillmentTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  fulfillmentSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1
  },
  fulfillmentDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 10,
    marginLeft: 44
  },

  // Items List
  itemsListContainer: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden"
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#FFFFFF"
  },
  itemBorderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  itemImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0F0F2",
    alignItems: "center",
    justifyContent: "center",
    padding: 6
  },
  itemImage: {
    width: "100%",
    height: "100%"
  },
  itemImageFallback: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center"
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 20
  },
  specsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 6
  },
  specChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill
  },
  colorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
    marginRight: 5
  },
  specChipText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary
  },
  priceContainer: {
    marginTop: 8
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 3
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  stepperBtnDisabled: {
    opacity: 0.35,
    elevation: 0
  },
  stepperQty: {
    minWidth: 26,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginHorizontal: 4
  },
  itemMicroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  microActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F7"
  },
  microActionBtnEdit: {
    backgroundColor: "rgba(220, 38, 38, 0.08)"
  },

  // Recommended Add-Ons
  recommendedSection: {
    marginTop: 22,
    paddingHorizontal: 16
  },
  recommendedHeader: {
    marginBottom: 12
  },
  recommendedEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: colors.brandAccent
  },
  recommendedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2
  },
  recommendedScroll: {
    gap: 12,
    paddingRight: 16
  },
  recommendedCard: {
    width: 148,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  recommendedImageWrapper: {
    width: "100%",
    height: 90,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  recommendedImage: {
    width: "88%",
    height: "88%"
  },
  recommendedItemName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 16,
    minHeight: 32
  },
  recommendedItemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4
  },
  recommendedAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingVertical: 6,
    marginTop: 8
  },
  recommendedAddBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600"
  },

  // Promo Code Section
  promoSection: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10
  },
  promoInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  promoInput: {
    flex: 1,
    height: 44,
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  promoApplyBtn: {
    backgroundColor: colors.brandAccent,
    borderRadius: 12,
    paddingHorizontal: 18,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  promoApplyBtnDisabled: {
    opacity: 0.4
  },
  promoApplyBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  },
  promoErrorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 6,
    fontWeight: "500"
  },
  promoSuccessText: {
    fontSize: 12,
    color: "#059669",
    marginTop: 6,
    fontWeight: "500"
  },
  appliedPromoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.2)",
    borderRadius: 12,
    padding: 12
  },
  appliedPromoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  appliedPromoCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669"
  },
  appliedPromoDetail: {
    fontSize: 12,
    color: "#059669",
    marginTop: 1
  },
  removePromoBtn: {
    padding: 4
  },

  // Confidence Card
  confidenceCard: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  confidenceItem: {
    flexDirection: "row",
    alignItems: "center"
  },
  confidenceTextCol: {
    flex: 1,
    marginLeft: 12
  },
  confidenceTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  confidenceSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1
  },
  confidenceDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 12,
    marginLeft: 32
  },

  // Summary Card
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 18,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  summaryCardHeader: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  freeShippingBadge: {
    backgroundColor: "rgba(0, 102, 204, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill
  },
  freeShippingText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandAccent
  },
  summaryTaxIncluded: {
    fontSize: 13,
    color: colors.textSecondary
  },
  summaryDiscountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669"
  },
  summaryDiscountValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669"
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 16
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text
  },
  summaryNote: {
    fontSize: 11,
    color: colors.textTertiary,
    lineHeight: 16,
    marginTop: 14
  },

  // Sticky Checkout Bar
  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 18,
    paddingTop: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8
  },
  stickyBarTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  stickyPriceCol: {
    flex: 1
  },
  stickyTotalLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: colors.textSecondary,
    textTransform: "uppercase"
  },
  stickyTotalPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginTop: 1
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: 28,
    paddingVertical: 14
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  paymentMethodsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 4
  },
  paymentMethodsText: {
    fontSize: 11,
    color: colors.textTertiary
  }
});
