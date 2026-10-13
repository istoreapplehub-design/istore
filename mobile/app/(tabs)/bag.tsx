/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on stepper [+/-]
 * - Haptics.impactAsync("light") on edit toggle and empty state button
 * - Haptics.impactAsync("medium") on remove item and checkout button
 */
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { useCartStore } from "../../store/useCartStore";
import { colors, formatGHS, typography } from "../../constants/theme";
import PriceTag from "../../components/PriceTag";

export default function BagScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [editMode, setEditMode] = useState(false);

  const { items, updateQty, removeItem, getSubtotalGHS } = useCartStore();
  const subtotalGHS = getSubtotalGHS();

  const handleStartShopping = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)");
  };

  const handleToggleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditMode(!editMode);
  };

  const handleCheckout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/checkout");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 1. Header */}
      <View style={[styles.header, { paddingTop: 8 }]}>
        <Text style={styles.headerTitle}>Bag</Text>
        {items.length > 0 && (
          <Pressable
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleToggleEdit}
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.editText}>{editMode ? "Done" : "Edit"}</Text>
          </Pressable>
        )}
      </View>

      {/* 2. Empty State */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Your Bag is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Items you add will appear here.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.startShoppingBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
            ]}
            onPress={handleStartShopping}
          >
            <Text style={styles.startShoppingText}>Start Shopping</Text>
          </Pressable>
        </View>
      ) : (
        /* 3. Items List + Summary */
        <View style={styles.contentWrapper}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Cart Items */}
            {items.map((item, index) => {
              const variantDetails = [item.color, item.storage]
                .filter(Boolean)
                .join(" · ");
              const isLast = index === items.length - 1;

              return (
                <Animated.View
                  key={`${item.productId}-${item.color || ""}-${item.storage || ""}`}
                  layout={Layout.springify()}
                  entering={FadeIn}
                  exiting={FadeOut.duration(200)}
                  style={[styles.itemCard, !isLast && styles.itemBorderBottom]}
                >
                  {/* Thumbnail */}
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />

                  {/* Details */}
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>

                    {variantDetails.length > 0 && (
                      <Text style={styles.itemVariant}>{variantDetails}</Text>
                    )}

                    <View style={styles.priceContainer}>
                      <PriceTag price={item.priceGHS} size="sm" />
                    </View>

                    {/* Stepper */}
                    <View style={styles.stepperRow}>
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
                          size={14}
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
                          size={14}
                          color={item.qty >= 10 ? colors.textTertiary : colors.text}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Remove Button */}
                  <Pressable
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={({ pressed }) => [
                      styles.removeBtn,
                      pressed && { opacity: 0.5 }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      removeItem(item.productId, item.color, item.storage);
                    }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </Animated.View>
              );
            })}

            {/* 4. Order Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatGHS(subtotalGHS)}</Text>
              </View>

              <View style={[styles.summaryRow, { marginTop: 10 }]}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.deliveryEstimate}>
                  Calculated at checkout
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>
                  {formatGHS(subtotalGHS)}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* 5. Sticky Bottom Checkout Bar */}
          <View
            style={[
              styles.stickyBar,
              { paddingBottom: Math.max(insets.bottom, 14) }
            ]}
          >
            <View style={styles.stickyPriceCol}>
              <Text style={styles.stickyTotalLabel}>Total</Text>
              <Text style={styles.stickyTotalPrice}>
                {formatGHS(subtotalGHS)}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.checkoutBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }
              ]}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutBtnText}>Checkout</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.text
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  editText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.accent
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    marginTop: -40
  },
  emptyTitle: {
    ...typography.h2,
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginTop: 20
  },
  emptySubtitle: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6
  },
  startShoppingBtn: {
    backgroundColor: colors.accent,
    borderRadius: 980,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 24
  },
  startShoppingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  },
  contentWrapper: {
    flex: 1,
    position: "relative"
  },
  scrollContent: {
    paddingBottom: 140
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.background
  },
  itemBorderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: colors.imageBg
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20
  },
  itemVariant: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  priceContainer: {
    marginTop: 6
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  stepperBtnDisabled: {
    opacity: 0.35
  },
  stepperQty: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginHorizontal: 4
  },
  removeBtn: {
    padding: 6,
    marginLeft: 8
  },
  summaryCard: {
    margin: 16,
    marginTop: 24,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.textSecondary
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text
  },
  deliveryEstimate: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic"
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 14
  },
  summaryTotalLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text
  },
  summaryTotalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text
  },
  stickyBar: {
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
    paddingHorizontal: 16,
    paddingTop: 12
  },
  stickyPriceCol: {
    flex: 1
  },
  stickyTotalLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  stickyTotalPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2
  },
  checkoutBtn: {
    backgroundColor: colors.accent,
    borderRadius: 980,
    paddingHorizontal: 26,
    paddingVertical: 14
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  }
});
