/**
 * Haptics Audit:
 * - Haptics.impactAsync("light") on contact support button
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, formatGHS, typography } from "../../constants/theme";
import { Order } from "../../types";
import {
  cancelOrder,
  getOrder,
  initializePayment,
  verifyPayment,
  ApiError
} from "../../services/api";
import { useUserStore } from "../../store/useUserStore";
import SkeletonLoader from "../../components/SkeletonLoader";
import ErrorState from "../../components/ErrorState";
import PaystackCheckoutModal from "../../components/PaystackCheckoutModal";
import { ProductVisual, getStoredImage } from "../../components/ProductVisual";
import { AppHaptics } from "../../lib/haptics";

function formatTimestamp(isoString?: string | null): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useUserStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getOrder(id, userId);
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, userId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDetail();
  };

  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [paystackData, setPaystackData] = useState<{
    authorization_url: string;
    reference: string;
  } | null>(null);

  const handlePayNow = async () => {
    if (!order || paying) return;
    AppHaptics.impactMedium();
    setPaying(true);
    try {
      const paymentInit = await initializePayment(order.id, { userId });
      if (paymentInit.simulation) {
        const verifyRes = await verifyPayment(paymentInit.reference);
        if (verifyRes.success) {
          setOrder(verifyRes.order);
          AppHaptics.success();
          Alert.alert("Payment Confirmed", "Your order has been paid and is now being prepared.");
        } else {
          throw new Error("Payment verification failed.");
        }
      } else {
        setPaystackData({
          authorization_url: paymentInit.authorization_url,
          reference: paymentInit.reference
        });
        setShowPaystack(true);
      }
    } catch (err: unknown) {
      Alert.alert(
        "Payment Failed",
        err instanceof Error ? err.message : "Could not initialize payment."
      );
    } finally {
      setPaying(false);
    }
  };

  const handlePaystackSuccess = async () => {
    setShowPaystack(false);
    if (!paystackData?.reference) return;
    try {
      setPaying(true);
      const verifyRes = await verifyPayment(paystackData.reference);
      if (verifyRes.order) {
        setOrder(verifyRes.order);
      } else {
        await fetchDetail();
      }
      AppHaptics.success();
    } catch {
      await fetchDetail();
    } finally {
      setPaying(false);
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;
    Alert.alert(
      "Cancel this order?",
      "The order will be cancelled and the reserved stock released. Paid orders are refunded to your original payment method within 5–10 business days.",
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelling(true);
              const updated = await cancelOrder(order.id);
              setOrder(updated);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (err: unknown) {
              Alert.alert(
                "Cancellation Failed",
                err instanceof Error ? err.message : "Could not cancel this order."
              );
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={{ padding: 16 }}>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <SkeletonLoader width={100} height={16} />
            <SkeletonLoader width={80} height={24} radius={980} style={{ marginTop: 8 }} />
          </View>
          {/* Timeline Skeleton */}
          <View style={styles.card}>
            <SkeletonLoader width={140} height={18} style={{ marginBottom: 16 }} />
            <SkeletonLoader width="80%" height={20} style={{ marginBottom: 12 }} />
            <SkeletonLoader width="65%" height={20} style={{ marginBottom: 12 }} />
            <SkeletonLoader width="50%" height={20} />
          </View>
          {/* Items Skeleton */}
          <View style={[styles.card, { marginTop: 24 }]}>
            <SkeletonLoader width={80} height={18} style={{ marginBottom: 16 }} />
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <SkeletonLoader width={48} height={48} radius={10} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <SkeletonLoader width="70%" height={16} />
                <SkeletonLoader width="40%" height={12} style={{ marginTop: 6 }} />
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    if (error) {
      return (
        <SafeAreaView style={styles.notFoundContainer} edges={["bottom"]}>
          <ErrorState
            error={error}
            primaryActionLabel={
              error instanceof ApiError && error.kind === "auth" ? "Sign In" : "Try Again"
            }
            onRetry={() => {
              if (error instanceof ApiError && error.kind === "auth") {
                router.push("/(auth)/login");
              } else {
                setLoading(true);
                fetchDetail();
              }
            }}
          />
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.notFoundContainer} edges={["bottom"]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
        <Text style={styles.notFoundTitle}>Order Not Found</Text>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const orderNum = `#${order.id.slice(0, 8).toUpperCase()}`;

  // Status progression checks
  const isPaidOrBeyond = ["paid", "shipped", "delivered"].includes(order.status);
  const isShippedOrBeyond = ["shipped", "delivered"].includes(order.status);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  const timelineSteps = [
    {
      title: "Order Placed",
      done: true,
      timestamp: formatTimestamp(order.createdAt)
    },
    {
      title: "Payment Confirmed",
      done: isPaidOrBeyond,
      timestamp: isPaidOrBeyond ? formatTimestamp(order.paidAt) : null
    },
    {
      title: "Shipped",
      done: isShippedOrBeyond,
      timestamp: isShippedOrBeyond ? formatTimestamp(order.shippedAt) : null
    },
    {
      title: "Delivered",
      done: isDelivered,
      timestamp: isDelivered ? formatTimestamp(order.deliveredAt) : null
    }
  ];

  const displayPaymentMethod = (() => {
    if (!order.paymentChannel) return "Mobile Money / Card";
    if (order.paymentChannel === "mobile_money") return "Mobile Money";
    if (order.paymentChannel === "card") return "Debit / Credit Card";
    return order.paymentChannel.toUpperCase();
  })();

  const discountGHS = Math.max(0, order.subtotalGHS + order.deliveryFeeGHS - order.totalGHS);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            title="Pull to refresh"
          />
        }
      >
        {/* 2. Order Number + Status Pill */}
        <View style={styles.headerBlock}>
          <Text style={styles.orderNumber}>{orderNum}</Text>
          <View
            style={[
              styles.statusPill,
              order.status === "paid" && styles.statusPaid,
              order.status === "shipped" && styles.statusShipped,
              order.status === "delivered" && styles.statusDelivered,
              order.status === "cancelled" && styles.statusCancelled
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                order.status === "paid" && { color: "#FFFFFF" },
                order.status === "shipped" && { color: "#171717" },
                order.status === "delivered" && { color: "#171717" },
                order.status === "cancelled" && { color: "#AEAEB2" }
              ]}
            >
              {order.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* 3. Tracking Timeline */}
        {isCancelled ? (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={24} color={colors.danger} />
            <Text style={styles.cancelledBannerText}>This order was cancelled</Text>
          </View>
        ) : (
          <View style={styles.timelineCard}>
            <Text style={styles.timelineHeader}>Tracking Progress</Text>
            {timelineSteps.map((step, idx) => {
              const isLast = idx === timelineSteps.length - 1;
              const nextStepDone = timelineSteps[idx + 1]?.done;

              return (
                <View key={step.title} style={styles.timelineRow}>
                  {/* Left Column: Circle & Connecting Line */}
                  <View style={styles.timelineLeftCol}>
                    <View
                      style={[
                        styles.timelineCircle,
                        step.done ? styles.circleDone : styles.circlePending
                      ]}
                    >
                      {step.done && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>

                    {!isLast && (
                      <View
                        style={[
                          styles.timelineLine,
                          nextStepDone ? styles.lineDone : styles.linePending
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Column: Step Label & Timestamp */}
                  <View style={styles.timelineRightCol}>
                    <Text
                      style={[
                        styles.timelineStepTitle,
                        step.done
                          ? styles.stepTitleDone
                          : styles.stepTitlePending
                      ]}
                    >
                      {step.title}
                    </Text>
                    {step.timestamp ? (
                      <Text style={styles.timelineTimestamp}>
                        {step.timestamp}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}

            {(order.courier || order.trackingNumber) && (
              <View style={styles.courierBox}>
                <Ionicons name="cube-outline" size={18} color={colors.text} />
                <View style={{ flex: 1 }}>
                  {order.courier ? (
                    <Text style={styles.courierTitle}>
                      Courier: {order.courier}
                    </Text>
                  ) : null}
                  {order.trackingNumber ? (
                    <Text style={styles.courierTracking}>
                      Tracking #: {order.trackingNumber}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
          </View>
        )}

        {/* 4. Items Section */}
        <Text style={styles.sectionHeader}>Items</Text>
        <View style={styles.card}>
          {order.items.map((item, idx) => {
            const variantLine = [item.color, item.storage]
              .filter(Boolean)
              .join(" · ");
            const isLast = idx === order.items.length - 1;
            const thumb = getStoredImage(item.image);

            return (
              <View
                key={idx}
                style={[styles.itemRow, !isLast && styles.itemRowBorder]}
              >
                {thumb ? (
                  <Image
                    source={{ uri: thumb }}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.itemImageFallback}>
                    <ProductVisual glyphSize={18} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {variantLine ? (
                    <Text style={styles.itemVariant}>{variantLine}</Text>
                  ) : null}
                  <Text style={styles.itemQtyPrice}>
                    {item.qty} × {formatGHS(item.priceGHS)}
                  </Text>

                  {(item.serialNumber || item.imei) ? (
                    <View style={styles.hardwareBadgeContainer}>
                      <View style={styles.hardwareBadge}>
                        <Ionicons name="hardware-chip-outline" size={12} color="#0071E3" />
                        <Text style={styles.hardwareBadgeText} numberOfLines={1}>
                          SN: {item.serialNumber || "—"}{item.imei ? ` · IMEI: ${item.imei}` : ""}
                        </Text>
                      </View>
                      {item.serialNumber ? (
                        <View style={styles.warrantyBadge}>
                          <Ionicons name="checkmark-circle" size={11} color="#059669" />
                          <Text style={styles.warrantyBadgeText}>Apple 1-Year Limited Warranty</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
                <Text style={styles.itemTotal}>
                  {formatGHS(item.qty * item.priceGHS)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* 5. Delivery Address Section */}
        <Text style={styles.sectionHeader}>Delivery Address</Text>
        <View style={styles.card}>
          <Text style={styles.addressName}>
            {order.shippingAddress?.fullName}
          </Text>
          <Text style={styles.addressText}>{order.shippingAddress?.phone}</Text>
          <Text style={styles.addressText}>
            {order.shippingAddress?.city}, {order.shippingAddress?.region}
          </Text>
          {order.shippingAddress?.gpsAddress ? (
            <Text style={styles.addressText}>
              GPS: {order.shippingAddress.gpsAddress}
            </Text>
          ) : null}
          {order.shippingAddress?.landmark ? (
            <Text style={styles.addressSub}>
              Landmark: {order.shippingAddress.landmark}
            </Text>
          ) : null}
        </View>

        {/* 6. Payment Summary Section */}
        <Text style={styles.sectionHeader}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatGHS(order.subtotalGHS)}
            </Text>
          </View>
          {discountGHS > 0 && (
            <View style={[styles.summaryRow, { marginTop: 8 }]}>
              <Text style={[styles.summaryLabel, { color: colors.success }]}>
                Promo Discount
              </Text>
              <Text style={[styles.summaryValue, { color: colors.success, fontWeight: "700" }]}>
                -{formatGHS(discountGHS)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, order.deliveryFeeGHS === 0 ? { fontSize: 13, color: colors.accent, fontWeight: "600" } : null]}>
              {order.deliveryFeeGHS > 0
                ? formatGHS(order.deliveryFeeGHS)
                : "TBD (Pay on Delivery)"}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatGHS(order.totalGHS)}</Text>
          </View>

          <Text style={styles.paidWithText}>
            {order.status === "pending"
              ? `Payment pending · ${displayPaymentMethod}`
              : order.status === "cancelled" && !order.paidAt
              ? "Order cancelled before payment"
              : `Paid with ${displayPaymentMethod}`}
          </Text>

          {order.paymentReference ? (
            <Text style={styles.referenceText}>
              Ref: {order.paymentReference}
            </Text>
          ) : null}
        </View>

        {/* 7. Actions & Help Section */}
        {order.status === "pending" && (
          <Pressable
            style={({ pressed }) => [
              styles.payNowBtn,
              pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
              paying && { opacity: 0.6 }
            ]}
            disabled={paying || cancelling}
            onPress={handlePayNow}
          >
            {paying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                <Text style={styles.payNowBtnText}>
                  Pay {formatGHS(order.totalGHS)} with Paystack
                </Text>
              </>
            )}
          </Pressable>
        )}

        {/* VIP Referral Bonus Card replacing Cancel Order */}
        <View style={styles.referralBonusCard}>
          <View style={styles.referralBonusHeader}>
            <View style={styles.referralIconCircle}>
              <Ionicons name="gift" size={20} color={colors.brandRed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.referralBonusTitle}>VIP Buyer Reward · Earn ₵300</Text>
              <Text style={styles.referralBonusSub}>
                Invite a friend with your order code. They save ₵250 on their Apple purchase and you earn ₵300 store credit.
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.shareReferralBtn,
              pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              Share.share({
                message: `Get ₵250 off your genuine Apple device on LesTrades using my VIP referral code: LESTRADES-${order.id.slice(0, 6).toUpperCase()}! Download: https://lestrades.com.gh`
              }).catch(() => {});
            }}
          >
            <Ionicons name="share-social-outline" size={17} color="#FFFFFF" />
            <Text style={styles.shareReferralBtnText}>
              Share Referral Code (LESTRADES-{order.id.slice(0, 6).toUpperCase()})
            </Text>
          </Pressable>
        </View>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>Need help or want to request a return?</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 18, marginTop: 4 }}>
            <Pressable
              style={styles.contactBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/returns" as any);
              }}
            >
              <Text style={styles.contactBtnText}>Returns & Refunds</Text>
            </Pressable>
            <Pressable
              style={styles.contactBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(
                  "LesTrades Customer Support",
                  "You can reach our LesTrades support team at support@lestrades.com.gh or 024 282 6590 (UCC Cape Coast Flagship)."
                );
              }}
            >
              <Text style={styles.contactBtnText}>Contact Support</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {paystackData && (
        <PaystackCheckoutModal
          visible={showPaystack}
          authorizationUrl={paystackData.authorization_url}
          reference={paystackData.reference}
          onSuccess={handlePaystackSuccess}
          onCancel={() => setShowPaystack(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface
  },
  scrollContent: {
    paddingBottom: 50
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  loadingText: {
    ...typography.caption,
    marginTop: 12,
    color: colors.textSecondary
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: colors.background
  },
  notFoundTitle: {
    ...typography.h3,
    fontSize: 20,
    marginTop: 16,
    color: colors.text
  },
  backBtn: {
    marginTop: 20,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 980
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600"
  },
  headerBlock: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  statusPill: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 980,
    marginTop: 8
  },
  statusPaid: {
    backgroundColor: "#171717"
  },
  statusShipped: {
    backgroundColor: "#E8E8E6"
  },
  statusDelivered: {
    backgroundColor: "#F2F2F7"
  },
  statusCancelled: {
    backgroundColor: "#F2F2F7"
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "700"
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: "rgba(23, 23, 23, 0.08)",
    borderRadius: 16
  },
  cancelledBannerText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.danger
  },
  timelineCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  timelineHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16
  },
  timelineRow: {
    flexDirection: "row"
  },
  timelineLeftCol: {
    width: 36,
    alignItems: "center"
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  circleDone: {
    backgroundColor: colors.accent
  },
  circlePending: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF"
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4
  },
  lineDone: {
    backgroundColor: colors.accent
  },
  linePending: {
    backgroundColor: colors.border
  },
  timelineRightCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 24
  },
  timelineStepTitle: {
    fontSize: 15
  },
  stepTitleDone: {
    fontWeight: "600",
    color: colors.text
  },
  stepTitlePending: {
    fontWeight: "400",
    color: colors.textSecondary
  },
  timelineTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4
  },
  courierBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginTop: 4
  },
  courierTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  courierTracking: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "monospace",
    marginTop: 2
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 10
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10
  },
  itemRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.imageBg
  },
  itemImageFallback: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden"
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  itemVariant: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  itemQtyPrice: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  hardwareBadgeContainer: {
    marginTop: 6,
    gap: 4
  },
  hardwareBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
    borderWidth: 1,
    borderColor: "#CCE4FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    gap: 4
  },
  hardwareBadgeText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#0071E3",
    fontWeight: "600"
  },
  warrantyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: "flex-start",
    gap: 4
  },
  warrantyBadgeText: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "700"
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  addressName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  },
  addressText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 3
  },
  addressSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4
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
    fontWeight: "500",
    color: colors.text
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 12
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text
  },
  paidWithText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12
  },
  referenceText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: "monospace",
    marginTop: 4
  },
  payNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 15,
    borderRadius: 980,
    backgroundColor: colors.accent
  },
  payNowBtnText: {
    ...typography.body,
    color: "#FFFFFF",
    fontWeight: "700"
  },
  referralBonusCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.brandRedBorder,
    shadowColor: colors.brandRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2
  },
  referralBonusHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  referralIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brandRedSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.brandRedBorder
  },
  referralBonusTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0D0D12"
  },
  referralBonusSub: {
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: 3
  },
  shareReferralBtn: {
    marginTop: 12,
    backgroundColor: colors.brandRed,
    borderRadius: 980,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  shareReferralBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700"
  },
  helpContainer: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 16
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary
  },
  contactBtn: {
    paddingVertical: 6,
    marginTop: 2
  },
  contactBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.accent
  }
});
