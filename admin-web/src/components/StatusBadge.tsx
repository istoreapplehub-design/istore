import React from "react";

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  pending: {
    bg: "bg-gray-100 border-gray-200",
    text: "text-gray-700",
    label: "Pending"
  },
  paid: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    label: "Paid"
  },
  shipped: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    label: "Shipped"
  },
  delivered: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    label: "Delivered"
  },
  cancelled: {
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    label: "Cancelled"
  }
};

export function StatusBadge({ status, size = "md" }: { status: OrderStatus; size?: "sm" | "md" }) {
  const config = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const isSm = size === "sm";

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${config.bg} ${config.text} ${
        isSm ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs"
      }`}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;
