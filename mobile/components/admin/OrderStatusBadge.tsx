import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: "Pending",
    bg: "#F2F2F7",
    text: "#6E6E73"
  },
  paid: {
    label: "Paid",
    bg: "#171717",
    text: "#FFFFFF"
  },
  shipped: {
    label: "Shipped",
    bg: "#E8E8E6",
    text: "#171717"
  },
  delivered: {
    label: "Delivered",
    bg: "#F2F2F7",
    text: "#171717"
  },
  cancelled: {
    label: "Cancelled",
    bg: "#F2F2F7",
    text: "#AEAEB2"
  }
};

export function OrderStatusBadge({
  status,
  size = "sm"
}: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isMd = size === "md";

  return (
    <View
      style={[
        styles.pill,
        isMd ? styles.pillMd : styles.pillSm,
        { backgroundColor: config.bg }
      ]}
    >
      <Text
        style={[
          styles.text,
          isMd ? styles.textMd : styles.textSm,
          { color: config.text }
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 980,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center"
  },
  pillSm: {
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  pillMd: {
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  text: {
    fontWeight: "700"
  },
  textSm: {
    fontSize: 11
  },
  textMd: {
    fontSize: 12
  }
});

export default OrderStatusBadge;
