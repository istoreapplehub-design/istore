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
  ChevronLeft,
  Wrench,
  Calendar,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  User,
  Check,
  AlertCircle,
  Camera,
  Eye,
  ShieldCheck
} from "lucide-react";
import {
  formatGHS,
  getAdminOrderById,
  getAdminOrders,
  timeAgo,
  updateAdminOrderStatus,
  getGeniusBookings,
  updateGeniusBookingStatus,
  getTodayAtLesTradesEvents,
  createTodayAtLesTradesEvent,
  deleteTodayAtLesTradesEvent,
  getTradeInSubmissions,
  updateTradeInSubmissionStatus
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

  const [mainView, setMainView] = useState<"orders" | "genius_bar" | "today_at_lestrades" | "trade_in">("orders");

  // Trade-In Inspection State
  const [tradeInPhotoModal, setTradeInPhotoModal] = useState<string | null>(null);
  const [tradeInFilter, setTradeInFilter] = useState<string>("all");
  const [editingCreditId, setEditingCreditId] = useState<string | null>(null);
  const [creditInput, setCreditInput] = useState<string>("");

  // Orders Support state
  const [tab, setTab] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  // New Event Form State
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventCategory, setNewEventCategory] = useState("Photography");
  const [newEventTagline, setNewEventTagline] = useState("");
  const [newEventSchedule, setNewEventSchedule] = useState("Saturday · 4:00 PM – 5:30 PM");
  const [newEventDuration, setNewEventDuration] = useState("90 min");
  const [newEventLevel, setNewEventLevel] = useState("All Levels");
  const [newEventSeats, setNewEventSeats] = useState("12");
  const [newEventInstructor, setNewEventInstructor] = useState("LesTrades Certified Mentor");
  const [newEventDescription, setNewEventDescription] = useState("");

  // Orders Queries
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

  // Genius Bar Queries
  const { data: geniusData, isLoading: geniusLoading, refetch: refetchGenius } = useQuery({
    queryKey: ["admin-genius-bar"],
    queryFn: getGeniusBookings,
    refetchInterval: 15000
  });

  // Today at LesTrades Queries
  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ["admin-today-at-lestrades"],
    queryFn: getTodayAtLesTradesEvents,
    refetchInterval: 20000
  });

  const orders = data?.data ?? [];
  const summary = data?.summary;
  const listed = orders.find((o) => o.id === selectedId) ?? orders[0] ?? null;

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
      toast.success(`Order ${shortId(updated)} is now ${updated.status.toUpperCase()}`);
      setCancelTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update order status.")
  });

  const geniusStatusMutation = useMutation({
    mutationFn: (vars: { reference: string; status: string }) =>
      updateGeniusBookingStatus(vars.reference, vars.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-genius-bar"] });
      toast.success("Genius Bar appointment updated.");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update appointment.")
  });

  const createEventMutation = useMutation({
    mutationFn: createTodayAtLesTradesEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-today-at-lestrades"] });
      toast.success("New Today at LesTrades event created!");
      setShowEventModal(false);
      setNewEventTitle("");
      setNewEventTagline("");
      setNewEventDescription("");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create event.")
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteTodayAtLesTradesEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-today-at-lestrades"] });
      toast.success("Workshop event deleted.");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete event.")
  });

  // Trade-In Submissions Query & Mutation
  const {
    data: tradeInData,
    isLoading: tradeInLoading,
    refetch: refetchTradeIn
  } = useQuery({
    queryKey: ["admin-trade-in-submissions"],
    queryFn: getTradeInSubmissions,
    refetchInterval: 15000
  });

  const tradeInStatusMutation = useMutation({
    mutationFn: (vars: { id: string; status: string; finalCreditGHS?: number; inspectionNotes?: string }) =>
      updateTradeInSubmissionStatus(vars.id, {
        status: vars.status,
        finalCreditGHS: vars.finalCreditGHS,
        inspectionNotes: vars.inspectionNotes
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trade-in-submissions"] });
      toast.success("Trade-in inspection updated.");
      setEditingCreditId(null);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update trade-in status.")
  });

  const templates = active
    ? [
        {
          label: "Payment status",
          text: `Hello ${displayName(active)}, this is LesTrades about order ${shortId(
            active
          )}. Your payment channel on file is ${
            CHANNEL_LABELS[active.paymentChannel || ""] || "unconfirmed"
          }. `
        },
        {
          label: "Dispatch update",
          text: `Hello ${displayName(active)}, your order ${shortId(
            active
          )} has been packed for delivery from LESTRADES_UCC CAPE COAST to ${
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

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      toast.error("Please provide an event title.");
      return;
    }
    createEventMutation.mutate({
      title: newEventTitle.trim(),
      category: newEventCategory,
      tagline: newEventTagline.trim(),
      schedule: newEventSchedule.trim(),
      duration: newEventDuration.trim(),
      level: newEventLevel,
      seats: Number(newEventSeats) || 10,
      instructor: newEventInstructor.trim(),
      description: newEventDescription.trim()
    });
  };

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-[#ebebe9] shadow-xs">
        <ApiError message={(errorObj as Error)?.message} onRetry={refetch} />
      </div>
    );
  }

  const geniusBookings = geniusData?.bookings || [];
  const events = eventsData?.events || [];
  const tradeIns = tradeInData?.submissions || [];
  const filteredTradeIns =
    tradeInFilter === "all"
      ? tradeIns
      : tradeIns.filter((ti: any) => ti.status === tradeInFilter);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header & Main Navigation View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Customer Services & Store Hub
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Flagship Hub: <span className="text-[#0066CC] font-bold">LESTRADES_UCC CAPE COAST</span> · Tel: 024 282 6590
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="inline-flex p-1 bg-neutral-200/70 rounded-2xl border border-neutral-300/50 self-start">
          <button
            type="button"
            onClick={() => setMainView("orders")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              mainView === "orders"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            <Headphones className="w-4 h-4 text-[#0066CC]" />
            Order Support
          </button>

          <button
            type="button"
            onClick={() => setMainView("genius_bar")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 relative ${
              mainView === "genius_bar"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            <Wrench className="w-4 h-4 text-emerald-600" />
            Genius Bar Requests
            {geniusBookings.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded-full">
                {geniusBookings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainView("today_at_lestrades")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              mainView === "today_at_lestrades"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            <Calendar className="w-4 h-4 text-purple-600" />
            Today at LesTrades
          </button>

          <button
            type="button"
            onClick={() => setMainView("trade_in")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 relative ${
              mainView === "trade_in"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            Trade-In Submissions
            {tradeIns.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 font-bold rounded-full">
                {tradeIns.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: GENIUS BAR REQUESTS (Hardwares & Diagnostics)
         ══════════════════════════════════════════════════════════════════════ */}
      {mainView === "genius_bar" && (
        <div className="bg-white rounded-3xl border border-[#ebebe9] shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-600" />
                Genius Bar In-Person Repair Appointments
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Hardware appointments booked for LESTRADES_UCC CAPE COAST
              </p>
            </div>
            <button
              onClick={() => refetchGenius()}
              className="text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              Refresh Queue
            </button>
          </div>

          {geniusLoading ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-400 animate-pulse">
              Loading Genius Bar bookings…
            </div>
          ) : geniusBookings.length === 0 ? (
            <Empty>No Genius Bar repair requests currently booked.</Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {geniusBookings.map((b: any) => {
                const wa = toWhatsappNumber(b.phone);
                return (
                  <div
                    key={b.reference}
                    className="p-5 border border-gray-100 rounded-2xl bg-neutral-50/70 hover:bg-white hover:border-gray-300 transition space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {b.reference}
                        </span>
                        <h3 className="text-sm font-bold text-gray-900 mt-1">{b.customerName}</h3>
                        <p className="text-xs text-gray-500">{b.phone}</p>
                      </div>

                      <select
                        value={b.status}
                        onChange={(e) =>
                          geniusStatusMutation.mutate({
                            reference: b.reference,
                            status: e.target.value
                          })
                        }
                        className="text-xs font-bold bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-gray-800 outline-none focus:border-black cursor-pointer shadow-2xs"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="in_service">In Service</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-900 font-semibold">
                        <Wrench className="w-3.5 h-3.5 text-gray-400" />
                        <span>{b.device}</span>
                      </div>
                      <p className="text-gray-500 pl-5">Issue: {b.issue}</p>
                      {b.serialNumber && (
                        <p className="text-[11px] font-mono text-gray-400 pl-5">
                          Serial: {b.serialNumber}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-gray-500 pl-5 pt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{b.date} · {b.slot}</span>
                      </div>
                      {b.notes && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-2">
                          Note: {b.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://wa.me/${wa}?text=${encodeURIComponent(
                          `Hello ${b.customerName}, this is LesTrades (UCC Cape Coast) regarding your Genius Bar appointment ${b.reference} for ${b.device}:`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                      <a
                        href={`tel:${b.phone}`}
                        className="p-2 border border-gray-200 bg-white hover:bg-gray-100 text-gray-800 rounded-xl transition"
                        title="Call Customer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 2: TODAY AT LESTRADES (Workshops & Creator Sessions)
         ══════════════════════════════════════════════════════════════════════ */}
      {mainView === "today_at_lestrades" && (
        <div className="bg-white rounded-3xl border border-[#ebebe9] shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Today at LesTrades — Workshop Management
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Campus creative and coding labs hosted at LESTRADES_UCC CAPE COAST
              </p>
            </div>

            <button
              onClick={() => setShowEventModal(true)}
              className="px-4 py-2 bg-[#0066CC] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Create New Workshop
            </button>
          </div>

          {eventsLoading ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-400 animate-pulse">
              Loading Today at LesTrades sessions…
            </div>
          ) : events.length === 0 ? (
            <Empty>No active workshop events. Click "Create New Workshop" to host an event.</Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((ev: any) => (
                <div
                  key={ev.id}
                  className="border border-gray-100 bg-neutral-50/70 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-gray-300 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {ev.category}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Remove event "${ev.title}"?`)) {
                            deleteEventMutation.mutate(ev.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 transition p-1"
                        title="Delete Workshop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 leading-snug">{ev.title}</h3>
                    <p className="text-xs text-gray-600 font-medium">{ev.tagline}</p>
                    <p className="text-xs text-gray-500 line-clamp-3">{ev.description}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-200/60 text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{ev.schedule} ({ev.duration})</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-700">{ev.hub}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-gray-500">Instructor: {ev.instructor}</span>
                      <span className="font-bold text-[#0066CC]">
                        {ev.availableSeats} / {ev.totalSeats} seats
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Event Modal */}
          {showEventModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scale-in space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0066CC]" />
                    Host New "Today at LesTrades" Workshop
                  </h3>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="text-gray-400 hover:text-black font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Workshop Title *</label>
                    <input
                      type="text"
                      required
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="e.g. Photo Walk: Framing Cape Coast Horizons"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Category</label>
                      <select
                        value={newEventCategory}
                        onChange={(e) => setNewEventCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none"
                      >
                        <option value="Photography">Photography</option>
                        <option value="Coding">Coding</option>
                        <option value="Art & Design">Art & Design</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Youth">Youth</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Available Seats</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={newEventSeats}
                        onChange={(e) => setNewEventSeats(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Schedule & Time *</label>
                    <input
                      type="text"
                      required
                      value={newEventSchedule}
                      onChange={(e) => setNewEventSchedule(e.target.value)}
                      placeholder="e.g. Saturday · 3:30 PM – 5:00 PM"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tagline</label>
                    <input
                      type="text"
                      value={newEventTagline}
                      onChange={(e) => setNewEventTagline(e.target.value)}
                      placeholder="Short catchy hook for students and creators"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Instructor Name</label>
                    <input
                      type="text"
                      value={newEventInstructor}
                      onChange={(e) => setNewEventInstructor(e.target.value)}
                      placeholder="Specialist / Fellow name"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      placeholder="What attendees will learn and create during this session..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEventModal(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createEventMutation.isPending}
                      className="px-5 py-2 bg-[#0066CC] hover:bg-blue-700 text-white font-bold rounded-xl transition"
                    >
                      {createEventMutation.isPending ? "Creating…" : "Publish Workshop"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 4: TRADE-IN SUBMISSIONS (Device Verification & Photos)
         ══════════════════════════════════════════════════════════════════════ */}
      {mainView === "trade_in" && (
        <div className="bg-white rounded-3xl border border-[#ebebe9] shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                Customer Trade-In Submissions & Photos
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Inspect customer uploads (Front, Back, Battery Health) & approve trade-in credits at LESTRADES_UCC CAPE COAST
              </p>
            </div>
            <button
              onClick={() => refetchTradeIn()}
              className="text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              Refresh Submissions
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Submissions" },
              { id: "pending_inspection", label: "Pending Inspection" },
              { id: "approved", label: "Approved" },
              { id: "completed", label: "Completed" },
              { id: "rejected", label: "Declined" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTradeInFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  tradeInFilter === f.id
                    ? "bg-black text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredTradeIns.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Camera className="w-12 h-12 mx-auto stroke-1 text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-700">No trade-in submissions found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Customer submissions will appear here once they assess their Apple device and upload front, back, and battery photos in the mobile app.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTradeIns.map((ti: any) => (
                <div
                  key={ti.id || ti.reference}
                  className="p-5 border border-gray-200 rounded-2xl hover:border-black/30 transition bg-neutral-50/50 space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black bg-neutral-200 px-2.5 py-1 rounded-lg text-neutral-800">
                        {ti.reference}
                      </span>
                      <div>
                        <h4 className="text-base font-extrabold text-gray-900">{ti.modelName || "Apple Hardware"}</h4>
                        <p className="text-xs text-gray-500">
                          {ti.storage || "256 GB"} · {ti.color || "Original"} · Serial/IMEI:{" "}
                          <span className="font-mono font-bold text-black">{ti.serialOrImei}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          ti.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : ti.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : ti.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ti.status === "pending_inspection"
                          ? "Pending Inspection"
                          : ti.status === "approved"
                          ? "Approved for Trade"
                          : ti.status === "completed"
                          ? "Credit Issued"
                          : "Declined"}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(ti.createdAt)}</span>
                    </div>
                  </div>

                  {/* Customer & Condition Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Customer Details</p>
                      <p className="font-bold text-gray-900 mt-1">{ti.customerName || "Customer"}</p>
                      <p className="text-gray-600">{ti.customerPhone}</p>
                      {ti.customerPhone && (
                        <div className="flex items-center gap-2 mt-2">
                          <a
                            href={`https://wa.me/${toWhatsappNumber(ti.customerPhone)}?text=${encodeURIComponent(
                              `Hello ${ti.customerName || ""}, regarding your LesTrades Trade-In submission ${ti.reference}:`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>
                          <a
                            href={`tel:${ti.customerPhone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                          >
                            <Phone className="w-3 h-3" /> Call
                          </a>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Condition Assessment</p>
                      <div className="space-y-1 mt-1 text-gray-700">
                        <p>
                          Screen: <span className="font-bold text-black capitalize">{ti.condition?.screenCondition || "Flawless"}</span>
                        </p>
                        <p>
                          Battery Health: <span className="font-bold text-black capitalize">{ti.condition?.batteryHealth || "Optimal"}</span>
                        </p>
                        <p>
                          Biometrics / Sensors:{" "}
                          <span className="font-bold text-black">
                            {ti.condition?.sensorsWorking !== false ? "100% Operational" : "Defective"}
                          </span>
                        </p>
                        <p>
                          iCloud Lock:{" "}
                          <span className="font-bold text-emerald-600">
                            {ti.condition?.icloudUnlocked !== false ? "Clean / Unlocked" : "LOCKED"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Trade-In Value</p>
                      <p className="text-xl font-black text-emerald-600 mt-1">
                        {formatGHS(ti.finalCreditGHS || ti.estimatedValueGHS || 0)}
                      </p>
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        Drop-off point: <span className="font-semibold text-gray-700">LESTRADES_UCC CAPE COAST</span>
                      </p>
                    </div>
                  </div>

                  {/* 3 Uploaded Customer Photographs */}
                  <div>
                    <p className="font-bold text-gray-700 text-xs mb-2 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-neutral-500" />
                      Uploaded Customer Photos (Front Screen, Back Enclosure, Battery Section)
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "1. Front Display", uri: ti.photos?.front },
                        { label: "2. Back Enclosure", uri: ti.photos?.back },
                        { label: "3. Battery Health", uri: ti.photos?.battery }
                      ].map((slot, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden relative group"
                        >
                          <div className="p-2 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-700">{slot.label}</span>
                            {slot.uri ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                Attached
                              </span>
                            ) : (
                              <span className="text-[10px] bg-gray-100 text-gray-400 font-medium px-1.5 py-0.5 rounded">
                                Not uploaded
                              </span>
                            )}
                          </div>
                          <div className="h-32 bg-neutral-100 flex items-center justify-center overflow-hidden">
                            {slot.uri ? (
                              <div
                                onClick={() => setTradeInPhotoModal(slot.uri)}
                                className="w-full h-full cursor-pointer relative"
                              >
                                <img
                                  src={slot.uri}
                                  alt={slot.label}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                  <Eye className="w-6 h-6 text-white drop-shadow" />
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-300">
                                <Camera className="w-8 h-8 mx-auto stroke-1 mb-1" />
                                <span className="text-[10px]">No photo</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Controls for Admin */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {editingCreditId === ti.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={creditInput}
                            onChange={(e) => setCreditInput(e.target.value)}
                            placeholder="Final Credit ₵"
                            className="w-32 px-2.5 py-1 text-xs border border-gray-300 rounded-lg outline-none focus:border-black"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              tradeInStatusMutation.mutate({
                                id: ti.id,
                                status: "approved",
                                finalCreditGHS: Number(creditInput) || ti.estimatedValueGHS
                              });
                            }}
                            className="px-3 py-1 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCreditId(null)}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-black"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCreditId(ti.id);
                            setCreditInput(String(ti.finalCreditGHS || ti.estimatedValueGHS || ""));
                          }}
                          className="text-xs font-bold text-gray-700 hover:text-black underline"
                        >
                          Adjust Approved Credit Value
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {ti.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => tradeInStatusMutation.mutate({ id: ti.id, status: "approved" })}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve Quote
                        </button>
                      )}
                      {ti.status !== "completed" && (
                        <button
                          type="button"
                          onClick={() => tradeInStatusMutation.mutate({ id: ti.id, status: "completed" })}
                          className="px-3.5 py-1.5 bg-[#0066CC] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed / Paid
                        </button>
                      )}
                      {ti.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => tradeInStatusMutation.mutate({ id: ti.id, status: "rejected" })}
                          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition"
                        >
                          Decline
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photo Zoom Modal */}
      {tradeInPhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setTradeInPhotoModal(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl p-2">
            <img src={tradeInPhotoModal} alt="Device Inspection" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl" />
            <button
              onClick={() => setTradeInPhotoModal(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 3: ORDER SUPPORT QUEUE (Standard Customer Support)
         ══════════════════════════════════════════════════════════════════════ */}
      {mainView === "orders" && (
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
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900">
                          {shortId(o)}
                        </span>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 truncate max-w-[180px]">
                          {displayName(o)}
                        </span>
                        <span className="font-bold text-gray-900">{formatGHS(o.totalGHS)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                        <span>
                          {itemCount(o)} item{itemCount(o) === 1 ? "" : "s"} ·{" "}
                          {CHANNEL_LABELS[o.paymentChannel || ""] || "Pending"}
                        </span>
                        <span>{timeAgo(o.createdAt)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ─── RIGHT: CUSTOMER DETAIL & DIRECT MESSAGING ───────────────── */}
          <div className={`lg:col-span-7 flex flex-col ${mobileShowDetail ? "flex" : "hidden lg:flex"}`}>
            {!active ? (
              <div className="p-16 text-center text-gray-400 text-sm font-medium">
                Select an order from the list to see customer details.
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMobileShowDetail(false)}
                      className="lg:hidden p-1.5 rounded-lg border border-gray-200 text-gray-600"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-extrabold text-gray-900">
                          {displayName(active)}
                        </h2>
                        <StatusBadge status={active.status} />
                      </div>
                      <p className="text-xs text-gray-400 font-mono">
                        {shortId(active)} · Placed {timeAgo(active.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/orders/${active.id}`}
                    className="text-xs font-bold text-neutral-900 hover:text-black flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition"
                  >
                    View order
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-gray-400 font-medium">Customer contact</span>
                    <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {phone || "No phone on file"}
                    </div>
                    {email && (
                      <div className="font-medium text-gray-600 flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {email}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-gray-400 font-medium">Delivery destination</span>
                    <div className="font-semibold text-gray-800 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span>
                        {active.shippingAddress?.city || active.deliveryRegion || "LESTRADES_UCC CAPE COAST"}
                        {active.shippingAddress?.landmark ? `, ${active.shippingAddress.landmark}` : ""}
                        {active.shippingAddress?.gpsAddress ? ` (${active.shippingAddress.gpsAddress})` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Transitions */}
                {TRANSITIONS[active.status]?.length > 0 && (
                  <div className="px-5 py-3 border-b border-gray-100 bg-neutral-50/60 flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-gray-500 font-bold text-[11px] uppercase tracking-wider">
                      Quick actions:
                    </span>
                    {TRANSITIONS[active.status].map((next) => (
                      <button
                        key={next}
                        type="button"
                        disabled={statusMutation.isPending}
                        onClick={() => {
                          if (next === "cancelled") {
                            setCancelTarget(active);
                          } else {
                            statusMutation.mutate({ id: active.id, status: next });
                          }
                        }}
                        className="px-3 py-1 bg-white border border-gray-200 hover:border-black rounded-lg font-bold text-gray-800 shadow-2xs transition"
                      >
                        Mark as {next.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                {/* Messaging Draft Section */}
                <div className="flex-1 p-5 flex flex-col space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Direct WhatsApp Reply Template
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {templates.map((tpl) => (
                        <button
                          key={tpl.label}
                          type="button"
                          onClick={() => setDrafts((d) => ({ ...d, [active.id]: tpl.text }))}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={4}
                      value={draft}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [active.id]: e.target.value }))
                      }
                      placeholder="Type a custom message for this customer…"
                      className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-black outline-none transition"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    {waNumber ? (
                      <button
                        type="button"
                        onClick={handleSendWhatsapp}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Send via WhatsApp
                      </button>
                    ) : null}
                    {email ? (
                      <a
                        href={`mailto:${email}?subject=${encodeURIComponent(
                          `LesTrades order ${shortId(active)}`
                        )}&body=${encodeURIComponent(draft)}`}
                        className="px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Open in Email
                      </a>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
