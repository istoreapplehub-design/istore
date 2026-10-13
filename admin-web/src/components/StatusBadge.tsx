import React from "react";

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; label: string; dot: string }> = {
  pending: {
    bg: "bg-neutral-100 border-neutral-200",
    text: "text-neutral-700",
    dot: "bg-neutral-400",
    label: "Pending"
  },
  paid: {
    bg: "bg-neutral-900 border-neutral-900",
    text: "text-white",
    dot: "bg-white",
    label: "Paid"
  },
  shipped: {
    bg: "bg-neutral-100 border-neutral-300",
    text: "text-neutral-900",
    dot: "bg-neutral-700",
    label: "Shipped"
  },
  delivered: {
    bg: "bg-white border-neutral-900",
    text: "text-neutral-900",
    dot: "bg-neutral-900",
    label: "Delivered"
  },
  cancelled: {
    bg: "bg-neutral-50 border-neutral-200",
    text: "text-neutral-400",
    dot: "bg-neutral-300",
    label: "Cancelled"
  }
};

export function StatusBadge({ status, size = "md" }: { status: OrderStatus; size?: "sm" | "md" }) {
  const config = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const isSm = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${config.bg} ${config.text} ${
        isSm ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}

export default StatusBadge;
