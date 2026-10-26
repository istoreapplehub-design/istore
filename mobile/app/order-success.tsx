import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { useCartStore } from "../store/useCartStore";
import { useUserStore } from "../store/useUserStore";
import { colors, formatGHS, typography } from "../constants/theme";
import { getOrder, trackGuestOrder } from "../services/api";
import { Order } from "../types";

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderId, guest, email } = useLocalSearchParams<{
    orderId?: string;
    guest?: string;
    email?: string;
  }>();
  const { clearCart } = useCartStore();
  const { userId, session } = useUserStore();

  const receiptEmail = (() => {
    if (!email) return "";
    try {
      return decodeURIComponent(email);
    } catch {
      return email;
    }
  })();
  const isGuestOrder = guest === "1" && !session;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const checkScale = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(1);

  // Clear cart immediately on mount and trigger celebratory haptic
  useEffect(() => {
    clearCart();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Prevent back navigation to checkout
    const backAction = () => {
      router.replace("/(tabs)");
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => backHandler.remove();
  }, [clearCart, router]);

  // Entrance animations
  useEffect(() => {
    checkScale.value = withDelay(
      200,
      withSpring(1, { damping: 12, stiffness: 100 })
    );

    ringScale.value = withDelay(
      450,
      withTiming(1.4, { duration: 600 })
    );

    ringOpacity.value = withDelay(
      450,
      withTiming(0, { duration: 600 })
    );
  }, [checkScale, ringScale, ringOpacity]);

  // Fetch order info
  useEffect(() => {
    let mounted = true;

    async function fetchOrderDetails() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const fetched = isGuestOrder
          ? await trackGuestOrder(orderId, receiptEmail)
          : await getOrder(orderId, userId);
        if (mounted) {
          setOrder(fetched);
        }
      } catch {
        // Fallback gracefully to basic summary if offline
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchOrderDetails();

    return () => {
      mounted = false;
    };
  }, [orderId, userId, isGuestOrder, receiptEmail]);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }]
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value
  }));

  const handleTrackOrder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (orderId) {
      router.push(`/orders/${orderId}`);
    } else {
      router.push("/orders");
    }
  };

  const handleCreateAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(auth)/register",
      params: { email: receiptEmail }
    });
  };

  const handleContinueShopping = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(tabs)");
  };

  const displayOrderNumber = orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : null;

  const displayPaymentMethod = (() => {
    if (!order?.paymentChannel) return "Mobile Money / Card";
    if (order.paymentChannel === "mobile_money") return "Mobile Money";
    if (order.paymentChannel === "card") return "Debit / Credit Card";
    return order.paymentChannel.toUpperCase();
  })();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Celebration Badge */}
        <View style={styles.badgeContainer}>
          <Animated.View style={[styles.pulseRing, ringAnimatedStyle]} />
          <Animated.View style={[styles.checkmarkCircle, checkAnimatedStyle]}>
            <Ionicons name="checkmark" size={56} color="#FFFFFF" />
          </Animated.View>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Order Confirmed</Text>
        <Text style={styles.subtitle}>
          Thank you! Your order has been placed and is being prepared for dispatch.
        </Text>

        {/* Order Details Card */}
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        ) : (
          <View style={styles.summaryCard}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Order Number</Text>
              <Text style={styles.cardValueMono}>{displayOrderNumber ?? "Pending"}</Text>
            </View>

            <View style={[styles.cardRow, styles.rowMargin]}>
              <Text style={styles.cardLabel}>Total Paid</Text>
              <Text style={styles.cardValueBold}>
                {order ? formatGHS(order.totalGHS) : "Confirmed"}
              </Text>
            </View>

            <View style={[styles.cardRow, styles.rowMargin]}>
              <Text style={styles.cardLabel}>Payment Method</Text>
              <Text style={styles.cardValue}>{displayPaymentMethod}</Text>
            </View>

            <View style={[styles.cardRow, styles.rowMargin]}>
              <Text style={styles.cardLabel}>Delivery Estimate</Text>
              <Text style={styles.cardValue}>1–4 working days</Text>
            </View>

            {order?.shippingAddress && (
              <View style={[styles.cardRow, styles.rowMargin]}>
                <Text style={styles.cardLabel}>Delivery Address</Text>
                <Text style={styles.cardValueAddress} numberOfLines={1}>
                  {`${order.shippingAddress.city}, ${order.shippingAddress.region}`}
                </Text>
              </View>
            )}
          </View>
        )}

        {isGuestOrder && (
          <Text style={styles.guestNote}>
            Keep this confirmation. Your order is linked to {receiptEmail || order?.shippingAddress?.phone || "the contact details you provided"} — quote your order number if you need to reach us about it.
          </Text>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          {isGuestOrder ? (
            <Pressable
              style={({ pressed }) => [
                styles.trackBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }
              ]}
              onPress={handleCreateAccount}
            >
              <Text style={styles.trackBtnText}>Create an account</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.pickupPassBtn,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/pickup-pass",
                    params: {
                      orderId: orderId || undefined,
                      customerName: order?.shippingAddress
                        ? typeof order.shippingAddress === "string"
                          ? JSON.parse(order.shippingAddress).fullName
                          : (order.shippingAddress as any).fullName
                        : undefined
                    }
                  } as any);
                }}
              >
                <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
                <Text style={styles.pickupPassBtnText}>Digital Store Pickup Pass</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.trackBtn,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }
                ]}
                onPress={handleTrackOrder}
              >
                <Text style={styles.trackBtnText}>Track Order</Text>
              </Pressable>
            </>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
            ]}
            onPress={handleContinueShopping}
          >
            <Text style={styles.continueBtnText}>Continue Shopping</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32
  },
  badgeContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
    height: 120
  },
  pulseRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(23, 23, 23, 0.3)"
  },
  checkmarkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16
      },
      android: {
        elevation: 6
      }
    })
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.text,
    textAlign: "center",
    marginTop: 20
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 16
  },
  summaryCard: {
    marginTop: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20
  },
  loadingCard: {
    marginTop: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  loadingText: {
    ...typography.caption,
    marginTop: 8,
    color: colors.textSecondary
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  rowMargin: {
    marginTop: 14
  },
  cardLabel: {
    fontSize: 14,
    color: colors.textSecondary
  },
  cardValueMono: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    fontWeight: "600",
    color: colors.text
  },
  cardValueBold: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  },
  cardValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text
  },
  cardValueAddress: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    maxWidth: "55%",
    textAlign: "right"
  },
  guestNote: {
    ...typography.caption,
    marginTop: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19
  },
  buttonsContainer: {
    marginTop: 28,
    gap: 12
  },
  pickupPassBtn: {
    height: 52,
    borderRadius: 980,
    backgroundColor: "#1D1D1F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)"
  },
  pickupPassBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  },
  trackBtn: {
    height: 52,
    borderRadius: 980,
    backgroundColor: "#0066CC",
    alignItems: "center",
    justifyContent: "center"
  },
  trackBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  },
  continueBtn: {
    height: 52,
    borderRadius: 980,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12
  },
  continueBtnText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "600"
  }
});
