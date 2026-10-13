import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Clock,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import {
  getRevenueStats,
  getAdminProductStats,
  getAdminPendingCount,
  getAdminOrders,
  formatGHS
} from "../lib/api";
import { StatCard } from "../components/StatCard";
import { RevenueChart } from "../components/RevenueChart";
import { StatusBadge } from "../components/StatusBadge";

export function Dashboard() {
  const { data: revStats, isLoading: loadingRev } = useQuery({
    queryKey: ["revenue-stats", "30d"],
    queryFn: () => getRevenueStats("30d")
  });

  const { data: prodStats, isLoading: loadingProd } = useQuery({
    queryKey: ["product-stats"],
    queryFn: getAdminProductStats
  });

  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ["pending-count"],
    queryFn: getAdminPendingCount
  });

  const { data: recentOrdersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: () => getAdminOrders({ page: 1, limit: 8, sort: "createdAt_desc" })
  });

  const isLoading = loadingRev || loadingProd || loadingPending;

  const lowStockCount = prodStats?.lowStock?.length || 0;
  const outOfStockCount = prodStats?.outOfStock?.length || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of sales performance, active inventory, and pending fulfillments.
        </p>
      </div>

      {/* Low Stock Banner if any */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Inventory Alert</p>
              <p className="text-xs text-amber-700">
                {outOfStockCount > 0 && `${outOfStockCount} item(s) out of stock. `}
                {lowStockCount > 0 && `${lowStockCount} item(s) running low on stock.`}
              </p>
            </div>
          </div>
          <Link
            to="/products?filter=lowStock"
            className="text-xs font-bold text-amber-800 hover:text-amber-900 underline px-3 py-1.5"
          >
            Review Inventory &rarr;
          </Link>
        </div>
      )}

      {/* 2. Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Revenue (30d)"
          value={isLoading ? "..." : formatGHS(revStats?.revenueGHS || 0)}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
          sublabel="Settled & shipped orders"
        />

        <StatCard
          label="Orders (30d)"
          value={isLoading ? "..." : revStats?.orderCount || 0}
          icon={<ShoppingBag className="w-5 h-5" />}
          iconBg="bg-indigo-50 text-indigo-600"
          sublabel={`Avg: ${formatGHS(revStats?.avgOrderValueGHS || 0)}`}
        />

        <StatCard
          label="Total Products"
          value={isLoading ? "..." : prodStats?.totalProducts || 0}
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
          sublabel={`${prodStats?.activeProducts || 0} active in store`}
        />

        <StatCard
          label="Pending Fulfillments"
          value={isLoading ? "..." : pendingData?.pending || 0}
          icon={<Clock className="w-5 h-5" />}
          iconBg={
            (pendingData?.pending || 0) > 0
              ? "bg-amber-100 text-amber-700 font-bold"
              : "bg-gray-50 text-gray-500"
          }
          sublabel={`${pendingData?.paid || 0} paid, ready to ship`}
        />
      </div>

      {/* 3. Two-Column: Revenue Chart (2/3) + Top Products (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Revenue Timeline</h2>
              <p className="text-xs text-gray-500">Daily gross sales over the last 30 days</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
              30 Days
            </span>
          </div>

          <RevenueChart data={revStats?.byDay || []} />
        </div>

        {/* Top 5 Products */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Sellers</h2>
            <Link to="/products" className="text-xs text-blue-600 font-semibold hover:underline">
              All Products
            </Link>
          </div>

          <div className="flex-1 divide-y divide-gray-100">
            {revStats?.topProducts && revStats.topProducts.length > 0 ? (
              revStats.topProducts.slice(0, 5).map((prod, idx) => (
                <div key={prod.productId || idx} className="py-3 flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-bold text-gray-400">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{prod.name}</p>
                    <p className="text-xs text-gray-500">{prod.unitsSold} units sold</p>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{formatGHS(prod.revenueGHS)}</span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-gray-400">
                No product sales recorded in this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Incoming Orders</h2>
            <p className="text-xs text-gray-500">Latest customer checkouts requiring attention</p>
          </div>
          <Link
            to="/orders"
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Total</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Payment</th>
                <th className="px-6 py-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingOrders ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-xs">
                    Loading orders...
                  </td>
                </tr>
              ) : recentOrdersData?.data && recentOrdersData.data.length > 0 ? (
                recentOrdersData.data.map((ord) => {
                  const shortId = `#${ord.id.slice(0, 8).toUpperCase()}`;
                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-gray-50/80 transition cursor-pointer"
                      onClick={() => (window.location.href = `/orders/${ord.id}`)}
                    >
                      <td className="px-6 py-4 font-mono font-semibold text-blue-600 text-xs">
                        <Link to={`/orders/${ord.id}`}>{shortId}</Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {ord.shippingAddress?.fullName || "Guest Customer"}
                        <span className="block text-xs font-normal text-gray-400">
                          {ord.shippingAddress?.city}, {ord.shippingAddress?.region}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatGHS(ord.totalGHS)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ord.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-xs capitalize text-gray-500">
                        {ord.paymentChannel ? ord.paymentChannel.replace("_", " ") : "Pending"}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 text-right whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleDateString("en-GH", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-xs">
                    No orders recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
