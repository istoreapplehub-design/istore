import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Receipt,
  Clock,
  CheckCircle2,
  Package,
  Calendar
} from "lucide-react";
import {
  getAdminOrders,
  getOrdersExportUrl,
  formatGHS
} from "../lib/api";
import { StatusBadge, OrderStatus } from "../components/StatusBadge";
import { useToast } from "../components/Toast";

const STATUS_TABS = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending" },
  { id: "paid", label: "Paid" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" }
];

export function Orders() {
  const navigate = useNavigate();
  const toast = useToast();

  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("q") ?? ""
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["admin-orders", page, search, statusFilter, fromDate, toDate],
    queryFn: () =>
      getAdminOrders({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sort: "createdAt_desc"
      })
  });

  const orders = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 15, total: 0, totalPages: 1, hasNext: false };
  const summary = data?.summary;

  const handleExport = () => {
    try {
      const url = getOrdersExportUrl({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search.trim() || undefined,
        from: fromDate || undefined,
        to: toDate || undefined
      });
      window.open(url, "_blank");
      toast.success("CSV download initiated.");
    } catch {
      toast.error("Failed to generate orders CSV.");
    }
  };

  const startCount = (meta.page - 1) * meta.limit + 1;
  const endCount = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fulfill incoming orders, update tracking numbers, and view customer purchase history.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-full px-5 py-2.5 shadow-sm transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary Row Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Revenue
            </span>
            <span className="text-lg font-bold text-gray-900 mt-1 block">
              {formatGHS(summary.totalRevenueGHS)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Orders Count
            </span>
            <span className="text-lg font-bold text-gray-900 mt-1 block">
              {summary.totalOrders}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Pending
            </span>
            <span className="text-lg font-bold text-gray-900 mt-1 block">
              {summary.byStatus?.pending || 0}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-[10px] font-bold text-neutral-900 uppercase tracking-wider block">
              Paid
            </span>
            <span className="text-lg font-bold text-neutral-900 mt-1 block">
              {summary.byStatus?.paid || 0}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
              Shipped
            </span>
            <span className="text-lg font-bold text-gray-900 mt-1 block">
              {summary.byStatus?.shipped || 0}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Delivered
            </span>
            <span className="text-lg font-bold text-emerald-600 mt-1 block">
              {summary.byStatus?.delivered || 0}
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-100">
          {STATUS_TABS.map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition whitespace-nowrap ${
                  isSelected
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Dates Row */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, phone number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto text-xs text-gray-500">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <span className="text-gray-400">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-gray-700 outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <span className="text-gray-400">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-gray-700 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Payment Method</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-xs">
                    Loading orders registry...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((ord) => {
                  const shortId = `#${ord.id.slice(0, 8).toUpperCase()}`;
                  const customerName = ord.shippingAddress?.fullName || ord.user?.name || "Customer";
                  const phone = ord.shippingAddress?.phone || ord.user?.phone || "";
                  const itemCount = ord.itemCount ?? ord._count?.items ?? ord.items?.length ?? 0;

                  return (
                    <tr
                      key={ord.id}
                      onClick={() => navigate(`/orders/${ord.id}`)}
                      className="hover:bg-gray-50/80 transition cursor-pointer"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-xs text-neutral-900">
                        {shortId}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 block truncate max-w-xs">
                          {customerName}
                        </span>
                        <span className="text-xs text-gray-400">{phone}</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-gray-900">
                        {formatGHS(ord.totalGHS)}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={ord.status} size="sm" />
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-gray-500 capitalize">
                        {ord.paymentChannel ? ord.paymentChannel.replace("_", " ") : "Pending"}
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleDateString("en-GH", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/orders/${ord.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg inline-block transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-gray-400">
                    <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-base font-semibold text-gray-700">No orders found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Check your search filters or wait for customer checkouts.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta.total > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              Showing {startCount}–{endCount} of {meta.total} orders
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || isPlaceholderData}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold px-2 text-gray-700">
                Page {meta.page} of {meta.totalPages}
              </span>

              <button
                disabled={!meta.hasNext || isPlaceholderData}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
