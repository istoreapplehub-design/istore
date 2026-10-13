import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { colors } from "../../../constants/theme";
import { Order, OrderItem } from "../../../types";
import {
  getAdminOrderById,
  getAdminOrderTimeline,
  getOrdersExportUrl,
  OrderTimelineEvent,
  updateAdminOrderStatus
} from "../../../services/adminApi";
import { OrderStatus, OrderStatusBadge } from "../../../components/admin/OrderStatusBadge";
import { OrderTimeline } from "../../../components/admin/OrderTimeline";
import { StatusUpdateSheet, UpdatableOrderStatus } from "../../../components/admin/StatusUpdateSheet";

function formatTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return "N/A";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(d);
  } catch {
    return isoString;
  }
}

export default function AdminOrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<OrderTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchOrderData = useCallback(async () => {
    if (!id) return;
    try {
      const [ord, tl] = await Promise.all([
        getAdminOrderById(id),
        getAdminOrderTimeline(id)
      ]);
      setOrder(ord);
      setTimeline(tl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load order";
      Alert.alert("Error", msg, [{ text: "Back", onPress: () => router.back() }]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderData();
  };

  const isFinalState = order?.status === "delivered" || order?.status === "cancelled";

  const handleCopyText = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", `${label} copied to clipboard.`);
  };

  const handleOpenPhone = (phone: string) => {
    Haptics.selectionAsync();
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Error", "Could not dial phone number.");
    });
  };

  const handleOpenEmail = (email: string) => {
    Haptics.selectionAsync();
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert("Error", "Could not open mail client.");
    });
  };

  const handleExportSingle = async () => {
    if (!id) return;
    try {
      Haptics.selectionAsync();
      const url = getOrdersExportUrl({ search: id });
      await Linking.openURL(url);
    } catch {
      Alert.alert("Export Error", "Could not export order.");
    }
  };

  const handleQuickActionsMenu = () => {
    if (!order) return;
    Haptics.selectionAsync();

    const shortId = `#${order.id.slice(0, 8).toUpperCase()}`;
    const phone = order.shippingAddress?.phone || "";

    Alert.alert("Order Options", `Actions for ${shortId}`, [
      { text: "Copy Order ID", onPress: () => handleCopyText(order.id, "Order ID") },
      ...(phone
        ? [
            { text: "Call Customer", onPress: () => handleOpenPhone(phone) },
            { text: "Copy Phone", onPress: () => handleCopyText(phone, "Customer phone") }
          ]
        : []),
      { text: "Export CSV", onPress: handleExportSingle },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleStatusSubmit = async (data: {
    status: UpdatableOrderStatus;
    trackingNumber?: string;
    courier?: string;
    adminNote?: string;
  }) => {
    if (!id) return;
    try {
      setSubmittingStatus(true);
      await updateAdminOrderStatus(id, data);

      // TODO: trigger customer SMS/email on status change
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSheetVisible(false);
      await fetchOrderData();

      Alert.alert("Status Updated", `Order marked as ${data.status.toUpperCase()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order status.";
      Alert.alert("Update Failed", msg);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleDangerCancel = () => {
    if (!id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Cancel Order",
      "This will cancel the order. If the customer already paid, refund via Paystack dashboard.",
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: async () => {
            try {
              await updateAdminOrderStatus(id, { status: "cancelled" });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await fetchOrderData();
              Alert.alert("Order Cancelled", "The order has been cancelled.");
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Failed to cancel order";
              Alert.alert("Error", msg);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Order not found.</Text>
      </View>
    );
  }

  const shortId = `#${order.id.slice(0, 8).toUpperCase()}`;
  const address = order.shippingAddress;
  const items: OrderItem[] = order.items || [];
  const trackingNumber = (order as any).trackingNumber;
  const courier = (order as any).courier;
  const adminNote = (order as any).adminNote;

  let statusSubtitle = "";
  if (order.status === "paid" && order.paidAt) {
    statusSubtitle = `Paid on ${formatTimestamp(order.paidAt)}`;
  } else if (order.status === "shipped") {
    statusSubtitle = `Shipped${courier ? ` via ${courier}` : ""}${
      trackingNumber ? ` · ${trackingNumber}` : ""
    }`;
  } else if (order.status === "delivered" && order.deliveredAt) {
    statusSubtitle = `Delivered on ${formatTimestamp(order.deliveredAt)}`;
  } else if (order.status === "cancelled" && order.cancelledAt) {
    statusSubtitle = `Cancelled on ${formatTimestamp(order.cancelledAt)}`;
  }

  return (
    <View style={styles.container}>
      {/* 1. HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{shortId}</Text>

        <View style={styles.headerRight}>
          <Pressable
            disabled={isFinalState}
            onPress={() => {
              Haptics.selectionAsync();
              setSheetVisible(true);
            }}
            style={[
              styles.updateBtn,
              isFinalState && styles.updateBtnDisabled
            ]}
          >
            <Text
              style={[
                styles.updateBtnText,
                isFinalState && styles.updateBtnTextDisabled
              ]}
            >
              Update
            </Text>
          </Pressable>

          <Pressable
            hitSlop={8}
            onPress={handleQuickActionsMenu}
            style={styles.moreBtn}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* 2. STATUS BANNER */}
        <View style={styles.statusBanner}>
          <OrderStatusBadge status={order.status} size="md" />
          {statusSubtitle ? (
            <Text style={styles.statusSubtitle}>{statusSubtitle}</Text>
          ) : null}
        </View>

        {/* 3. CUSTOMER CARD */}
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.card}>
          <Text style={styles.customerName}>{address?.fullName || "Guest Customer"}</Text>

          {address?.phone ? (
            <Pressable
              onPress={() => handleOpenPhone(address.phone)}
              style={styles.contactRow}
            >
              <Ionicons name="call-outline" size={16} color={colors.accent} />
              <Text style={styles.contactLink}>{address.phone}</Text>
            </Pressable>
          ) : null}

          {(order as any).user?.email ? (
            <Pressable
              onPress={() => handleOpenEmail((order as any).user.email)}
              style={styles.contactRow}
            >
              <Ionicons name="mail-outline" size={16} color={colors.accent} />
              <Text style={styles.contactLink}>{(order as any).user.email}</Text>
            </Pressable>
          ) : null}

          <View style={styles.hairline} />

          <Text style={styles.subhead}>Delivery Address</Text>
          <Text style={styles.addressLine}>
            {address?.city}, {address?.region}
          </Text>
          {address?.gpsAddress ? (
            <Text style={styles.addressSubLine}>GPS: {address.gpsAddress}</Text>
          ) : null}
          {address?.landmark ? (
            <Text style={styles.addressSubLine}>Landmark: {address.landmark}</Text>
          ) : null}

          {order.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Customer Notes:</Text>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* 4. TIMELINE */}
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.card}>
          <OrderTimeline timeline={timeline} />
        </View>

        {/* 5. ITEMS */}
        <Text style={styles.sectionTitle}>Items ({items.length})</Text>
        <View style={styles.card}>
          {items.map((it, idx) => (
            <View key={it.id || idx}>
              {idx > 0 && <View style={styles.hairline} />}
              <View style={styles.itemRow}>
                {it.image ? (
                  <Image source={{ uri: it.image }} style={styles.itemThumb} />
                ) : (
                  <View style={[styles.itemThumb, styles.thumbEmpty]}>
                    <Ionicons name="cube-outline" size={20} color={colors.textTertiary} />
                  </View>
                )}

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {it.name}
                  </Text>
                  {(it.color || it.storage) && (
                    <Text style={styles.itemVariant}>
                      {[it.color, it.storage].filter(Boolean).join(" · ")}
                    </Text>
                  )}
                </View>

                <View style={styles.itemPriceCol}>
                  <Text style={styles.itemPrice}>
                    ₵{(it.priceGHS * it.qty).toLocaleString("en-GH")}
                  </Text>
                  <Text style={styles.itemQty}>Qty: {it.qty}</Text>
                </View>
              </View>
            </View>
          ))}

          <View style={[styles.hairline, { marginTop: 14 }]} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ₵{(order.subtotalGHS || 0).toLocaleString("en-GH")}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>
              ₵{(order.deliveryFeeGHS || 0).toLocaleString("en-GH")}
            </Text>
          </View>

          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ₵{(order.totalGHS || 0).toLocaleString("en-GH")}
            </Text>
          </View>
        </View>

        {/* 6. PAYMENT */}
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Method</Text>
            <Text style={styles.infoValue}>
              {order.paymentChannel ? order.paymentChannel.replace("_", " ").toUpperCase() : "Pending"}
            </Text>
          </View>

          {order.paymentReference ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reference</Text>
              <Pressable
                onPress={() => handleCopyText(order.paymentReference || "", "Payment Reference")}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Text style={styles.referenceMono}>{order.paymentReference}</Text>
                <Ionicons name="copy-outline" size={14} color={colors.accent} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Paid At</Text>
            <Text style={styles.infoValue}>{formatTimestamp(order.paidAt)}</Text>
          </View>
        </View>

        {/* 7. ADMIN SECTION */}
        <Text style={styles.sectionTitle}>Admin Fulfillment</Text>
        <View style={styles.card}>
          {courier ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Courier</Text>
              <Text style={styles.infoValue}>{courier}</Text>
            </View>
          ) : null}

          {trackingNumber ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tracking #</Text>
              <Pressable
                onPress={() => handleCopyText(trackingNumber, "Tracking Number")}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Text style={styles.referenceMono}>{trackingNumber}</Text>
                <Ionicons name="copy-outline" size={14} color={colors.accent} />
              </Pressable>
            </View>
          ) : null}

          {adminNote ? (
            <View style={[styles.infoRow, { flexDirection: "column", alignItems: "flex-start" }]}>
              <Text style={styles.infoLabel}>Admin Note</Text>
              <Text style={[styles.infoValue, { marginTop: 4 }]}>{adminNote}</Text>
            </View>
          ) : null}

          <View style={styles.hairline} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Placed On</Text>
            <Text style={styles.infoValue}>{formatTimestamp(order.createdAt)}</Text>
          </View>

          {order.shippedAt ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Shipped On</Text>
              <Text style={styles.infoValue}>{formatTimestamp(order.shippedAt)}</Text>
            </View>
          ) : null}

          {order.deliveredAt ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Delivered On</Text>
              <Text style={styles.infoValue}>{formatTimestamp(order.deliveredAt)}</Text>
            </View>
          ) : null}

          {order.cancelledAt ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cancelled On</Text>
              <Text style={[styles.infoValue, { color: colors.danger }]}>
                {formatTimestamp(order.cancelledAt)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 8. DANGER ZONE */}
        {!isFinalState && (
          <>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.7 }]}
                onPress={handleDangerCancel}
              >
                <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
                <Text style={styles.dangerBtnText}>Cancel Order</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Status Update Sheet Modal */}
      <StatusUpdateSheet
        visible={sheetVisible}
        currentStatus={order.status}
        onClose={() => setSheetVisible(false)}
        onSubmit={handleStatusSubmit}
        submitting={submittingStatus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background
  },
  backBtn: {
    padding: 4
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    fontFamily: "monospace"
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  updateBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16
  },
  updateBtnDisabled: {
    backgroundColor: colors.surface
  },
  updateBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700"
  },
  updateBtnTextDisabled: {
    color: colors.textTertiary
  },
  moreBtn: {
    padding: 4
  },
  scrollContent: {
    padding: 16
  },
  statusBanner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20
  },
  statusSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: "500"
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginLeft: 6,
    marginBottom: 8,
    marginTop: 16
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  customerName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6
  },
  contactLink: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: "600"
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 12
  },
  subhead: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  addressLine: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500"
  },
  addressSubLine: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  notesBox: {
    marginTop: 12,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 10
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary
  },
  notesText: {
    fontSize: 13,
    color: colors.text,
    marginTop: 2
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  itemThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.imageBg,
    resizeMode: "cover"
  },
  thumbEmpty: {
    alignItems: "center",
    justifyContent: "center"
  },
  itemDetails: {
    flex: 1
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
  itemPriceCol: {
    alignItems: "flex-end"
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  },
  itemQty: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary
  },
  summaryValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500"
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  referenceMono: {
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 8
  },
  dangerBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.danger
  }
});
