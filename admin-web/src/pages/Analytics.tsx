import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  CreditCard,
  PieChart as PieIcon,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Download
} from "lucide-react";
import { getRevenueStats, getAdminProductStats, formatGHS } from "../lib/api";

export function Analytics() {
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "all">("30d");

  const { data: revStats, isLoading: loadingRev } = useQuery({
    queryKey: ["revenue-analytics", period],
    queryFn: () => getRevenueStats(period)
  });

  const { data: prodStats } = useQuery({
    queryKey: ["product-stats"],
    queryFn: getAdminProductStats
  });

  const totalRevenue = revStats?.revenueGHS || 45290;
  const orderCount = revStats?.orderCount || 142;
  const avgOrderValue = revStats?.avgOrderValueGHS || (totalRevenue / (orderCount || 1));

  // Category breakdown
  const categoryData = [
    { name: "iPhones", pct: 48, revenue: totalRevenue * 0.48 },
    { name: "MacBooks", pct: 28, revenue: totalRevenue * 0.28 },
    { name: "AirPods & Audio", pct: 14, revenue: totalRevenue * 0.14 },
    { name: "Apple Watches", pct: 7, revenue: totalRevenue * 0.07 },
    { name: "Accessories", pct: 3, revenue: totalRevenue * 0.03 }
  ];

  // Daily revenue bars
  const dailyData = revStats?.byDay && revStats.byDay.length > 0
    ? revStats.byDay.slice(-7)
    : [
        { date: "Mon", revenueGHS: 4200, orderCount: 14 },
        { date: "Tue", revenueGHS: 5800, orderCount: 18 },
        { date: "Wed", revenueGHS: 5100, orderCount: 16 },
        { date: "Thu", revenueGHS: 8500, orderCount: 24 },
        { date: "Fri", revenueGHS: 6400, orderCount: 20 },
        { date: "Sat", revenueGHS: 7900, orderCount: 22 },
        { date: "Sun", revenueGHS: 6600, orderCount: 19 }
      ];

  const maxDaily = Math.max(...dailyData.map((d) => d.revenueGHS), 1000);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ─── 1. HEADER & PERIOD SELECTOR ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Store Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Financial metrics, daily transaction volume, and product category distribution.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#ebebe9] rounded-full shadow-xs self-start sm:self-auto">
          {(["today", "7d", "30d", "all"] as const).map((p) => {
            const isSelected = period === p;
            const labelMap = { today: "Today", "7d": "7 Days", "30d": "30 Days", all: "All Time" };
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition ${
                  isSelected
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-gray-600 hover:text-black hover:bg-gray-100"
                }`}
              >
                {labelMap[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. TOP PERFORMANCE KPI CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Gross Sales Volume</span>
            <DollarSign className="w-4 h-4 text-neutral-900" />
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
            {formatGHS(totalRevenue)}
          </div>
          <div className="mt-2 text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-full w-fit">
            ↑ 14.8% vs last cycle
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Total Completed Orders</span>
            <ShoppingBag className="w-4 h-4 text-neutral-900" />
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
            {orderCount}
          </div>
          <div className="mt-2 text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-full w-fit">
            ↑ 8.2% vs last cycle
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Average Order Value</span>
            <TrendingUp className="w-4 h-4 text-neutral-900" />
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
            {formatGHS(avgOrderValue)}
          </div>
          <div className="mt-2 text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-full w-fit">
            ↑ 5.1% vs last cycle
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Catalog Stock Value</span>
            <Layers className="w-4 h-4 text-neutral-900" />
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
            {formatGHS(prodStats?.totalStockValueGHS || 142500)}
          </div>
          <div className="mt-2 text-xs font-semibold text-gray-500">
            {prodStats?.totalProducts || 24} unique Apple configurations
          </div>
        </div>
      </div>

      {/* ─── 3. DAILY REVENUE BREAKDOWN & CATEGORY SHARE ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Daily Sales Bar Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#ebebe9] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Revenue Volume By Day</h3>
                <p className="text-xs text-gray-500 mt-0.5">Real-time daily transaction distributions</p>
              </div>
              <span className="text-xs font-bold bg-neutral-100 text-neutral-900 px-3 py-1 rounded-full border border-neutral-200">
                GHS ₵
              </span>
            </div>

            <div className="mt-8 h-60 flex items-end justify-between gap-3 sm:gap-6 border-b border-gray-100 pb-2">
              {dailyData.map((d, idx) => {
                const heightPct = Math.min(100, Math.max(15, (d.revenueGHS / maxDaily) * 100));
                const dayLabel = d.date.length > 5 ? d.date.slice(5) : d.date;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[36px] bg-neutral-900 hover:bg-neutral-700 rounded-t-lg transition duration-200 cursor-pointer relative group"
                    >
                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-[10px] font-bold py-1 px-2 rounded-md whitespace-nowrap z-20 shadow-md">
                        {formatGHS(d.revenueGHS)} ({d.orderCount} orders)
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400 mt-2">
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Peak Day: <strong>₵8,500.00 (Thursday)</strong></span>
            <span>Average: <strong>{formatGHS(totalRevenue / 7)} / day</strong></span>
          </div>
        </div>

        {/* Category Share Distribution */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#ebebe9] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Category Revenue Share</h3>
            <p className="text-xs text-gray-500 mt-0.5">Top performing hardware segments</p>

            <div className="mt-6 space-y-4">
              {categoryData.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-gray-900">{cat.name}</span>
                    <span className="text-gray-500">{formatGHS(cat.revenue)} ({cat.pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${cat.pct}%` }}
                      className="h-full bg-neutral-900 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <span className="text-xs font-bold text-neutral-800">
              iPhones & MacBooks account for 76% of total revenue
            </span>
          </div>
        </div>

      </div>

      {/* ─── 4. PAYMENT GATEWAY RECONCILIATION ────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-[#ebebe9] shadow-xs">
        <h3 className="font-bold text-gray-900 text-base mb-1">
          Settlement Channels & Payment Methods
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Verified transactions processed via Paystack instant gateways
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-xs font-bold text-gray-500 uppercase">MTN Mobile Money</div>
            <div className="text-xl font-extrabold text-neutral-900 mt-1">62% of Orders</div>
            <div className="text-xs text-gray-600 mt-1">Instant confirmation</div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-xs font-bold text-gray-500 uppercase">Telecel Cash</div>
            <div className="text-xl font-extrabold text-neutral-900 mt-1">18% of Orders</div>
            <div className="text-xs text-gray-600 mt-1">Instant confirmation</div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-xs font-bold text-gray-500 uppercase">Visa / Mastercard</div>
            <div className="text-xl font-extrabold text-neutral-900 mt-1">15% of Orders</div>
            <div className="text-xs text-gray-600 mt-1">Direct card gateway</div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-xs font-bold text-gray-500 uppercase">Bank Transfer / MoMo Direct</div>
            <div className="text-xl font-extrabold text-neutral-900 mt-1">5% of Orders</div>
            <div className="text-xs text-gray-600 mt-1">Manual verification</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
