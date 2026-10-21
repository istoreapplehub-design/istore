import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Send,
  Truck,
  CheckCircle2,
  XCircle,
  Headphones,
  CreditCard,
  ChevronLeft
} from "lucide-react";
import {
  formatGHS,
  getAdminOrderById,
  getAdminOrders,
  timeAgo,
  updateAdminOrderStatus
} from "../lib/api";
import { Order, OrderItem } from "../types";
import { OrderStatus, StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ApiError, Empty } from "../components/StatePanels";
import { useToast } from "../components/Toast";

const TABS: { id: "all" | OrderStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "paid", label: "Paid" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" }
];

const CHANNEL_LABELS: Record<string, string> = {
  mobile_money: "Mobile money",
  card: "Card",
  bank: "Bank transfer"
};

const TRANSITIONS: Record<OrderStatus, Array<"shipped" | "delivered" | "cancelled">> = {
  pending: ["cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: []
};

function displayName(order: Order): string {
  return order.shippingAddress?.fullName || order.user?.name || "Guest";
}

function displayPhone(order: Order): string {
  return order.shippingAddress?.phone || order.user?.phone || "";
}

/** Ghana WhatsApp links need a country code without symbols: 024… → 23324… */
function toWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.startsWith("233") || digits.startsWith("234")) return digits;
  return `233${digits}`;
}

function shortId(order: Order): string {
  return `#${order.id.slice(0, 8).toUpperCase()}`;
}

function itemCount(order: Order): number {
  return order.itemCount ?? order._count?.items ?? order.items?.length ?? 0;
}

export function Support() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const {
    data,
    isLoading,
    isError,
    error: errorObj,
    refetch
  } = useQuery({
    queryKey: ["support-orders", tab, search],
    queryFn: () =>
      getAdminOrders({
        page: 1,
        limit: 50,
        status: tab === "all" ? undefined : tab,
        search: search.trim() || undefined,
        sort: "createdAt_desc"
      })
  });

  const orders = data?.data ?? [];
  const summary = data?.summary;
  const listed = orders.find((o) => o.id === selectedId) ?? orders[0] ?? null;

  // The orders list omits line items; pull the full record for the selected order.
  const { data: detail } = useQuery({
    queryKey: ["support-order-detail", listed?.id],
    queryFn: () => getAdminOrderById(listed!.id),
    enabled: Boolean(listed?.id)
  });

  const active = detail && listed && detail.id === listed.id ? detail : listed;
  const draft = active ? drafts[active.id] ?? "" : "";

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: "shipped" | "delivered" | "cancelled" }) =>
      updateAdminOrderStatus(vars.id, { status: vars.status }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["support-orders"] });
      queryClient.invalidateQueries({ queryKey: ["support-order-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      queryClient.invalidateQueries({ queryKey: ["feed-orders"] });
      queryClient.invalidateQueries({ queryKey: ["pending-count"] });
      toast.success(`Order ${shortId(updated)} is now ${updated.status.toUpperCase()}`);
      setCancelTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update order status.")
  });

  const templates = active
    ? [
        {
          label: "Payment status",
          text: `Hello ${displayName(active)}, this is I-Dynamic about order ${shortId(
            active
          )}. Your payment channel on file is ${
            CHANNEL_LABELS[active.paymentChannel || ""] || "unconfirmed"
          }. `
        },
        {
          label: "Dispatch update",
          text: `Hello ${displayName(active)}, your order ${shortId(
            active
          )} has been packed for delivery to ${
            active.shippingAddress?.city || active.deliveryRegion || "your area"
          }. `
        },
        {
          label: "Address check",
          text: `Hello ${displayName(active)}, please confirm the delivery details on order ${shortId(
            active
          )} so we can dispatch to the right place. `
        }
      ]
    : [];

  const phone = active ? displayPhone(active) : "";
  const waNumber = active ? toWhatsappNumber(phone) : "";
  const email = active?.user?.email || active?.shippingAddress?.email || "";

  const handleSendWhatsapp = () => {
    if (!active || !waNumber) return;
    const text = draft.trim() || `Hello ${displayName(active)}, regarding order ${shortId(active)}:`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
    toast.success("WhatsApp opened with your draft.");
  };

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-[#ebebe9] shadow-xs">
        <ApiError message={(errorObj as Error)?.message} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
          Customer Care
        </h1>
        <p className="mt-1 text-sm text-gray-500 font-medium">
          Every customer here is a real order in the database. Replies open in WhatsApp or email on
          your device — this portal reads orders, it does not store message history.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#ebebe9] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* ─── LEFT: ORDER QUEUE ─────────────────────────────────────────── */}
        <div className={`lg:col-span-5 border-r border-gray-100 flex flex-col ${mobileShowDetail ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone or delivery address…"
                className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {TABS.map((t) => {
                const count =
                  t.id === "all" ? summary?.totalOrders : summary?.byStatus?.[t.id as OrderStatus];
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap transition ${
                      tab === t.id
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "text-gray-500 hover:text-black hover:bg-gray-100"
                    }`}
                  >
                    {t.label}
                    {typeof count === "number" ? ` (${count})` : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-12 text-center text-xs font-semibold text-gray-400 animate-pulse">
                Loading orders…
              </div>
            ) : orders.length === 0 ? (
              <Empty>
                {search.trim()
                  ? "No orders match that search."
                  : "No orders in this queue yet. Customers appear here as soon as they check out."}
              </Empty>
            ) : (
              orders.map((o) => {
                const isSelected = active?.id === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(o.id);
                      setMobileShowDetail(true);
                    }}
                    className={`w-full text-left p-4 transition ${
                      isSelected
                        ? "bg-neutral-50 border-l-4 border-neutral-900"
                        : "hover:bg-gray-50/60 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-gray-900 truncate">{displayName(o)}</span>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                        {timeAgo(o.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-2">
                      <span className="font-mono font-bold">{shortId(o)}</span>
                      <span>·</span>
                      <span>{formatGHS(o.totalGHS)}</span>
                      <span>·</span>
                      <span>
                        {itemCount(o)} item{itemCount(o) === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={o.status} size="sm" />
                      {o.paymentChannel ? (
                        <span className="text-[10px] text-gray-500">
                          {CHANNEL_LABELS[o.paymentChannel] || o.paymentChannel}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT: CUSTOMER + REPLY ───────────────────────────────────── */}
        <div className={`lg:col-span-7 flex flex-col justify-between bg-[#fafafa] ${mobileShowDetail ? "flex" : "hidden lg:flex"}`}>
          {!active ? (
            <div className="p-16 text-center text-gray-400 m-auto">
              <Headphones className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Select an order to see the customer</p>
            </div>
          ) : (
            <>
              <div className="p-5 bg-white border-b border-gray-100">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setMobileShowDetail(false)}
                  className="lg:hidden mb-3 inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back to queue
                </button>

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                      <span>{shortId(active)}</span>
                      <span>·</span>
                      <span>{new Date(active.createdAt).toLocaleString("en-GB")}</span>
                    </div>
                    <h2 className="text-base font-extrabold text-gray-900 mt-1 truncate">
                      {displayName(active)}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                      {phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-mono">{phone}</span>
                        </span>
                      ) : null}
                      {email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{email}</span>
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {[
                            active.shippingAddress?.city,
                            active.deliveryRegion || active.shippingAddress?.region
                          ]
                            .filter(Boolean)
                            .join(", ") || "No region on file"}
                        </span>
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/orders/${active.id}`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Order detail
                  </Link>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Status</div>
                    <div className="mt-1.5">
                      <StatusBadge status={active.status} size="sm" />
                    </div>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Total</div>
                    <div className="text-sm font-extrabold text-neutral-900 mt-1">
                      {formatGHS(active.totalGHS)}
                    </div>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Channel</div>
                    <div className="text-sm font-extrabold text-neutral-900 mt-1 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      {CHANNEL_LABELS[active.paymentChannel || ""] || "Not recorded"}
                    </div>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Courier</div>
                    <div className="text-sm font-extrabold text-neutral-900 mt-1 truncate">
                      {active.courier || "—"}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono truncate">
                      {active.trackingNumber || "No tracking number"}
                    </div>
                  </div>
                </div>

                {active.items?.length ? (
                  <div className="mt-4 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-gray-400">
                      Items on this order
                    </div>
                    {active.items.map((item: OrderItem) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs border-b border-gray-100 pb-1.5"
                      >
                        <span className="font-semibold text-gray-800 truncate pr-3">
                          {item.name}
                          {item.qty > 1 ? ` × ${item.qty}` : ""}
                        </span>
                        <span className="font-bold text-gray-900 shrink-0">
                          {formatGHS(item.priceGHS * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Status actions (same rules the API enforces) */}
              <div className="px-5 py-4 bg-white border-b border-gray-100 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 mr-1">
                  Order actions
                </span>
                {TRANSITIONS[active.status].includes("shipped") ? (
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() =>
                      statusMutation.mutate({ id: active.id, status: "shipped" })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-neutral-900 text-white hover:bg-black transition disabled:opacity-40"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Mark shipped
                  </button>
                ) : null}
                {TRANSITIONS[active.status].includes("delivered") ? (
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() =>
                      statusMutation.mutate({ id: active.id, status: "delivered" })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-neutral-900 text-white hover:bg-black transition disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark delivered
                  </button>
                ) : null}
                {TRANSITIONS[active.status].includes("cancelled") ? (
                  <button
                    type="button"
                    onClick={() => setCancelTarget(active)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel order
                  </button>
                ) : null}
                {TRANSITIONS[active.status].length === 0 ? (
                  <span className="text-xs text-gray-400 font-medium">
                    This order is closed — no status changes left.
                  </span>
                ) : null}
              </div>

              {/* Reply composer */}
              <div className="p-4 bg-white border-t border-gray-100 mt-auto">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 text-[11px]">
                  <span className="text-gray-400 font-bold shrink-0">Templates:</span>
                  {templates.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() =>
                        setDrafts((prev) => ({ ...prev, [active.id]: t.text }))
                      }
                      className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 whitespace-nowrap transition border border-gray-200"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={draft}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [active.id]: e.target.value }))
                  }
                  placeholder={`Write a message to ${displayName(active)}…`}
                  className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition resize-none"
                />

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {waNumber ? (
                    <button
                      type="button"
                      onClick={handleSendWhatsapp}
                      className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Open in WhatsApp
                    </button>
                  ) : null}
                  {email ? (
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent(
                        `I-Dynamic order ${shortId(active)}`
                      )}&body=${encodeURIComponent(draft)}`}
                      className="px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Open in Email
                    </a>
                  ) : null}
                  {!waNumber && !email ? (
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      This order has no phone or email on file.
                    </span>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        title="Cancel this order?"
        message={
          cancelTarget
            ? `Order ${shortId(cancelTarget)} for ${displayName(
                cancelTarget
              )} will be marked cancelled. The customer keeps their Paystack reference for a refund.`
            : ""
        }
        confirmText="Cancel order"
        confirmStyle="danger"
        loading={statusMutation.isPending}
        onConfirm={() =>
          cancelTarget &&
          statusMutation.mutate({ id: cancelTarget.id, status: "cancelled" })
        }
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}

export default Support;
