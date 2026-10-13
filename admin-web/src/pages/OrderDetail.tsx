import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Truck,
  Package,
  X
} from "lucide-react";
import {
  getAdminOrderById,
  getAdminOrderTimeline,
  updateAdminOrderStatus,
  formatGHS
} from "../lib/api";
import { StatusBadge, OrderStatus } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

const COURIER_PRESETS = ["DHL", "EMS", "Yango", "Bolt", "Jumia", "Other"];

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Form state inside modal
  const [newStatus, setNewStatus] = useState<"shipped" | "delivered" | "cancelled">("shipped");
  const [courier, setCourier] = useState("DHL");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const { data: order, isLoading: loadingOrder } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => getAdminOrderById(id!),
    enabled: Boolean(id)
  });

  const { data: timeline = [], isLoading: loadingTimeline } = useQuery({
    queryKey: ["admin-order-timeline", id],
    queryFn: () => getAdminOrderTimeline(id!),
    enabled: Boolean(id)
  });

  const updateStatusMutation = useMutation({
    mutationFn: (body: any) => updateAdminOrderStatus(id!, body),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-timeline", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["revenue-stats"] });
      toast.success(`Order updated to ${updated.status.toUpperCase()}`);
      setModalOpen(false);
      setCancelDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update order status.");
    }
  });

  if (loadingOrder) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        Order not found.
      </div>
    );
  }

  const shortId = `#${order.id.slice(0, 8).toUpperCase()}`;
  const address = order.shippingAddress;
  const isFinalState = order.status === "delivered" || order.status === "cancelled";

  // Allowed transitions
  const allowedTransitions: Array<{ value: "shipped" | "delivered" | "cancelled"; label: string }> =
    order.status === "pending"
      ? [{ value: "cancelled", label: "Cancel Order" }]
      : order.status === "paid"
      ? [
          { value: "shipped", label: "Mark as Shipped" },
          { value: "cancelled", label: "Cancel Order" }
        ]
      : order.status === "shipped"
      ? [
          { value: "delivered", label: "Mark as Delivered" },
          { value: "cancelled", label: "Cancel Order" }
        ]
      : [];

  const handleOpenStatusModal = () => {
    if (allowedTransitions.length > 0) {
      setNewStatus(allowedTransitions[0].value);
      setCourier("DHL");
      setTrackingNumber("");
      setAdminNote("");
      setModalOpen(true);
    }
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStatus === "shipped" && (!courier.trim() || !trackingNumber.trim())) {
      toast.error("Courier and tracking number are required for shipped orders.");
      return;
    }

    updateStatusMutation.mutate({
      status: newStatus,
      courier: newStatus === "shipped" ? courier.trim() : undefined,
      trackingNumber: newStatus === "shipped" ? trackingNumber.trim() : undefined,
      adminNote: adminNote.trim() ? adminNote.trim() : undefined
    });
  };

  const copyText = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(`${label} copied to clipboard.`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-full transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-gray-900">{shortId}</h1>
              <StatusBadge status={order.status} size="md" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString("en-GH")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={isFinalState || allowedTransitions.length === 0}
            onClick={handleOpenStatusModal}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm transition disabled:opacity-40"
          >
            Update Status
          </button>
        </div>
      </div>

      {/* 2. Desktop Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2/3): Customer & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Address Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Customer & Delivery</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Customer
                </span>
                <p className="text-base font-bold text-gray-900 mt-1">
                  {address?.fullName || order.user?.name || "Customer"}
                </p>

                {address?.phone && (
                  <a
                    href={`tel:${address.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline mt-2"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{address.phone}</span>
                  </a>
                )}

                {order.user?.email && (
                  <a
                    href={`mailto:${order.user.email}`}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline mt-1 block"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{order.user.email}</span>
                  </a>
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Shipping Destination
                </span>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {address?.city}, {address?.region}
                </p>
                {address?.gpsAddress && (
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    GPS: {address.gpsAddress}
                  </p>
                )}
                {address?.landmark && (
                  <p className="text-xs text-gray-500 mt-0.5">Landmark: {address.landmark}</p>
                )}
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-500">Customer Notes:</span>
                <p className="text-xs text-gray-700 mt-1 bg-gray-50 p-2.5 rounded-xl">
                  {order.notes}
                </p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Purchased Items ({order.items?.length || 0})
              </h2>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items?.map((it, idx) => (
                <div key={it.id || idx} className="p-4 sm:p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
                    {it.image ? (
                      <img src={it.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{it.name}</p>
                    {(it.color || it.storage) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[it.color, it.storage].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatGHS(it.priceGHS * it.qty)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatGHS(it.priceGHS)} &times; {it.qty}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtotal</span>
                <span>{formatGHS(order.subtotalGHS)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Delivery Fee</span>
                <span>{formatGHS(order.deliveryFeeGHS)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Amount</span>
                <span>{formatGHS(order.totalGHS)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Timeline & Admin Fulfillment */}
        <div className="space-y-6">
          {/* Timeline Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Progress Timeline</h2>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-gray-100">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      event.done
                        ? "bg-blue-600 text-white"
                        : "bg-white border-2 border-gray-200 text-transparent"
                    }`}
                  >
                    {event.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <p
                      className={`text-xs ${
                        event.done ? "font-bold text-gray-900" : "font-medium text-gray-400"
                      }`}
                    >
                      {event.label}
                    </p>
                    {event.at ? (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {new Date(event.at).toLocaleString("en-GH", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic mt-0.5">Pending</p>
                    )}

                    {event.trackingNumber && (
                      <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-mono font-semibold">
                        <Truck className="w-3 h-3" />
                        <span>
                          {event.courier ? `${event.courier}: ` : ""}
                          {event.trackingNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Fulfillment Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Fulfillment Data</h2>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Payment Method & Ref
              </span>
              <p className="text-sm font-semibold text-gray-900 capitalize mt-0.5">
                {order.paymentChannel ? order.paymentChannel.replace("_", " ") : "Pending Channel"}
              </p>
              {order.paymentReference && (
                <button
                  type="button"
                  onClick={() => copyText(order.paymentReference!, "Payment Reference")}
                  className="mt-1 flex items-center gap-1 font-mono text-xs text-blue-600 hover:underline"
                >
                  <span>{order.paymentReference}</span>
                  <Copy className="w-3 h-3" />
                </button>
              )}
            </div>

            {order.courier && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Courier
                </span>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{order.courier}</p>
              </div>
            )}

            {order.trackingNumber && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Tracking Number
                </span>
                <button
                  type="button"
                  onClick={() => copyText(order.trackingNumber!, "Tracking Number")}
                  className="mt-1 flex items-center gap-1 font-mono text-xs text-blue-600 hover:underline font-bold"
                >
                  <span>{order.trackingNumber}</span>
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}

            {order.adminNote && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Admin Internal Note
                </span>
                <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl mt-1">
                  {order.adminNote}
                </p>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          {!isFinalState && (
            <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-rose-900 mb-2">Danger Zone</h2>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Cancelling this order terminates fulfillment. If paid, initiate a manual refund via
                the Paystack dashboard.
              </p>
              <button
                type="button"
                onClick={() => setCancelDialogOpen(true)}
                className="w-full py-2.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-full transition"
              >
                Cancel Order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Update Order Status</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Transition Status
                </label>
                <div className="space-y-2">
                  {allowedTransitions.map((t) => (
                    <label
                      key={t.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        newStatus === t.value
                          ? "border-blue-600 bg-blue-50/50 text-blue-900 font-semibold"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="orderStatus"
                        value={t.value}
                        checked={newStatus === t.value}
                        onChange={() => setNewStatus(t.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {newStatus === "shipped" && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Courier Dispatch *
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {COURIER_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCourier(c === "Other" ? "" : c)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                            courier === c
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DHL Express, EMS Ghana"
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Tracking Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DHL9876543210"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Internal Admin Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes about fulfillment or customer communications..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm disabled:opacity-50"
                >
                  {updateStatusMutation.isPending ? "Updating..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        title="Cancel Order"
        message="This will mark the order as Cancelled. If the customer already paid via Paystack, refund them manually via the Paystack dashboard."
        confirmText="Cancel Order"
        confirmStyle="danger"
        loading={updateStatusMutation.isPending}
        onConfirm={() =>
          updateStatusMutation.mutate({
            status: "cancelled",
            adminNote: "Cancelled per admin action."
          })
        }
        onCancel={() => setCancelDialogOpen(false)}
      />
    </div>
  );
}

export default OrderDetail;
