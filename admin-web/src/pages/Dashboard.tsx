import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  ShoppingBag,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ExternalLink,
  CircleAlert
} from "lucide-react";
import {
  getRevenueStats,
  getAdminProductStats,
  getAdminOrders,
  formatGHS
} from "../lib/api";
import { useAuth } from "../hooks/useAuth";

export function Dashboard() {
  const { user } = useAuth();
  const [salesTimeframe, setSalesTimeframe] = useState("This week");
  const [productSort, setProductSort] = useState("By revenue");

  const { data: revStats } = useQuery({
    queryKey: ["revenue-stats", "30d"],
    queryFn: () => getRevenueStats("30d")
  });

  const { data: prodStats } = useQuery({
    queryKey: ["product-stats"],
    queryFn: getAdminProductStats
  });

  const { data: recentOrdersData } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: () => getAdminOrders({ page: 1, limit: 5 })
  });

  const todayDateFormatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  // Top products mock/real hybrid
  const topProducts = [
    {
      id: "1",
      name: "iPhone 15 Pro Max 256GB",
      price: 2340,
      sold: 492,
      total: 500,
      stock: 8,
      pct: 92,
      image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "2",
      name: "MacBook Pro 16\" M3 Max",
      price: 3680,
      sold: 369,
      total: 450,
      stock: 14,
      pct: 82,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "3",
      name: "AirPods Max Space Black",
      price: 1890,
      sold: 592,
      total: 800,
      stock: 26,
      pct: 74,
      image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=150&auto=format&fit=crop&q=80"
    }
  ];

  // Bar chart daily data for Sales Trend
  const barChartData = [
    { day: "Mon", lastWeek: 28, thisWeek: 42 },
    { day: "Tue", lastWeek: 35, thisWeek: 58 },
    { day: "Wed", lastWeek: 68, thisWeek: 50 },
    { day: "Thu", lastWeek: 45, thisWeek: 85 },
    { day: "Fri", lastWeek: 72, thisWeek: 60 },
    { day: "Sat", lastWeek: 55, thisWeek: 78 },
    { day: "Sun", lastWeek: 40, thisWeek: 65 }
  ];

  const recentOrders = recentOrdersData?.data?.slice(0, 4) || [
    { id: "1247", time: "2 min ago", total: 24.5, status: "shipped" },
    { id: "1246", time: "5 mins ago", total: 18.0, status: "pending" },
    { id: "1245", time: "8 min ago", total: 31.25, status: "delivered" },
    { id: "1244", time: "12 min ago", total: 15.5, status: "shipped" }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ─── 1. WELCOME GREETING ROW (IMAGE 1 HEADER) ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "Sarah"}!
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            {todayDateFormatted}. Get weekend summary!
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Online Customers Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#ebebe9] shadow-xs text-xs font-semibold text-gray-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>2 online customers</span>
          </div>

          {/* Today Filter Button */}
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#ebebe9] shadow-xs text-xs font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* ─── 2. TOP 4 METRIC CARDS WITH SPARK LINES (IMAGE 1) ───────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue today */}
        <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Revenue today</span>
            {/* Green Sparkline SVG */}
            <svg className="w-20 h-6 overflow-visible" viewBox="0 0 80 24" fill="none">
              <path
                d="M2 18 C 15 20, 25 10, 40 14 C 55 18, 65 4, 78 6"
                stroke="#4ade80"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 tracking-tight">
            ₵5,234
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full w-fit">
            <span>↑ 12.3%</span>
            <span className="text-gray-400 font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Card 2: Orders today */}
        <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Orders today</span>
            {/* Green Sparkline SVG */}
            <svg className="w-20 h-6 overflow-visible" viewBox="0 0 80 24" fill="none">
              <path
                d="M2 16 C 15 14, 25 20, 40 12 C 55 5, 65 14, 78 8"
                stroke="#4ade80"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 tracking-tight">
            42
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full w-fit">
            <span>↑ 5%</span>
            <span className="text-gray-400 font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Card 3: Average order */}
        <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Average order</span>
            {/* Green Sparkline SVG */}
            <svg className="w-20 h-6 overflow-visible" viewBox="0 0 80 24" fill="none">
              <path
                d="M2 19 C 15 12, 25 16, 40 8 C 55 12, 65 6, 78 4"
                stroke="#4ade80"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 tracking-tight">
            ₵124.62
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full w-fit">
            <span>↑ 7.1%</span>
            <span className="text-gray-400 font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Card 4: Conversion rate */}
        <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Conversion rate</span>
            {/* Red / Pink Sparkline SVG */}
            <svg className="w-20 h-6 overflow-visible" viewBox="0 0 80 24" fill="none">
              <path
                d="M2 6 C 15 8, 25 18, 40 14 C 55 12, 65 20, 78 18"
                stroke="#f87171"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 tracking-tight">
            3.2%
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50/80 px-2 py-0.5 rounded-full w-fit">
            <span>↑ 0.3%</span>
            <span className="text-gray-400 font-normal">vs yesterday</span>
          </div>
        </div>
      </div>

      {/* ─── 3. MIDDLE SECTION: SALES TREND & TOP PRODUCT (IMAGE 1) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Sales Trend (Dual Bar Chart) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#ebebe9] shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sales trend
              </span>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  ₵39,190
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  ↑ 8.4%
                </span>
              </div>
            </div>

            {/* Legends & Period Dropdown */}
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b6e49e]" />
                <span>Last week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1b564c]" />
                <span>This week</span>
              </div>

              <div className="relative">
                <select
                  value={salesTimeframe}
                  onChange={(e) => setSalesTimeframe(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1 text-xs font-semibold bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full cursor-pointer outline-none transition"
                >
                  <option value="This week">This week</option>
                  <option value="Last week">Last week</option>
                  <option value="This month">This month</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Dual Bar Chart Render */}
          <div className="mt-8 pt-4">
            <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 border-b border-gray-100 pb-2">
              {barChartData.map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  {/* Paired Bars */}
                  <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-full">
                    {/* Last Week Bar (Lime) */}
                    <div
                      style={{ height: `${item.lastWeek}%` }}
                      className="w-3 sm:w-5 bg-[#b6e49e] rounded-t-md transition-all duration-300 hover:opacity-90"
                      title={`Last Week: ${item.lastWeek}%`}
                    />
                    {/* This Week Bar (Dark Teal) */}
                    <div
                      style={{ height: `${item.thisWeek}%` }}
                      className="w-3 sm:w-5 bg-[#1b564c] rounded-t-md transition-all duration-300 hover:opacity-90"
                      title={`This Week: ${item.thisWeek}%`}
                    />
                  </div>
                  {/* Day Label */}
                  <span className="text-[11px] font-semibold text-gray-400 mt-2">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>

            {/* Y-Axis Value Labels */}
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold pt-2">
              <span>₵0</span>
              <span>₵2K</span>
              <span>₵4K</span>
              <span>₵6K</span>
              <span>₵8K</span>
              <span>₵10K</span>
            </div>
          </div>
        </div>

        {/* Right Column: Top Product Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#ebebe9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Top product</h3>
            
            <div className="relative">
              <select
                value={productSort}
                onChange={(e) => setProductSort(e.target.value)}
                className="appearance-none pl-2.5 pr-6 py-1 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-full cursor-pointer outline-none"
              >
                <option value="By revenue">By revenue</option>
                <option value="By volume">By volume</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="divide-y divide-gray-100 space-y-4 pt-2">
            {topProducts.map((p) => (
              <div key={p.id} className="pt-3 flex items-center gap-3">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0 bg-gray-50"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-gray-900 truncate">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                    <span className="font-bold text-gray-800">₵{p.price.toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">{p.sold}/{p.total} Sold</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Stock: {p.stock} units
                  </div>

                  {/* Progress bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${p.pct}%` }}
                        className="h-full bg-gray-900 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700">{p.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── 4. BOTTOM SECTION (3 COLUMNS: ALERTS, TRAFFIC, ORDERS) ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Column 1: Inventory alerts */}
        <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Inventory alerts</h3>
                <span className="text-[11px] text-gray-400">3 items need attention</span>
              </div>
              <Link
                to="/products"
                className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition"
              >
                See all
              </Link>
            </div>

            <div className="mt-5 space-y-4">
              {/* Item 1: Critical */}
              <div className="p-3 bg-gray-50/70 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Critical</span>
                  </div>
                  <span className="font-bold text-gray-700 text-[11px]">5 units left</span>
                </div>
                <div className="mt-1.5 font-bold text-xs text-gray-900 truncate">
                  iPhone 15 Pro 128GB
                </div>
                <div className="text-[11px] text-gray-400">Sells: 3 pcs/day</div>

                {/* Segmented bar */}
                <div className="mt-2 flex items-center gap-1">
                  <div className="flex-1 h-1 bg-rose-500 rounded-full" />
                  <div className="flex-1 h-1 bg-rose-500 rounded-full" />
                  <div className="flex-1 h-1 bg-rose-500 rounded-full" />
                  <div className="flex-1 h-1 bg-gray-200 rounded-full" />
                  <div className="flex-1 h-1 bg-gray-200 rounded-full" />
                </div>
              </div>

              {/* Item 2: Low */}
              <div className="p-3 bg-gray-50/70 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Low</span>
                  </div>
                  <span className="font-bold text-gray-700 text-[11px]">8 units left</span>
                </div>
                <div className="mt-1.5 font-bold text-xs text-gray-900 truncate">
                  Apple Watch Ultra 2
                </div>
                <div className="text-[11px] text-gray-400">Sells: 2 pcs/day</div>

                {/* Segmented bar */}
                <div className="mt-2 flex items-center gap-1">
                  <div className="flex-1 h-1 bg-amber-500 rounded-full" />
                  <div className="flex-1 h-1 bg-amber-500 rounded-full" />
                  <div className="flex-1 h-1 bg-gray-200 rounded-full" />
                  <div className="flex-1 h-1 bg-gray-200 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Traffic sources (Donut Chart) */}
        <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Traffic sources</h3>
              <span className="text-xs text-gray-400 font-semibold bg-gray-50 px-2 py-0.5 rounded-full">
                This week ⌵
              </span>
            </div>

            {/* Donut Chart with Center Visitor Stat */}
            <div className="my-6 flex items-center justify-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="60" stroke="#f3f4f6" strokeWidth="18" fill="transparent" />
                  {/* Segment 1: Mobile (Dark Teal) */}
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    stroke="#1b564c"
                    strokeWidth="18"
                    strokeDasharray="376"
                    strokeDashoffset="140"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  {/* Segment 2: Web (Lime) */}
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    stroke="#b6e49e"
                    strokeWidth="18"
                    strokeDasharray="376"
                    strokeDashoffset="260"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  {/* Segment 3: Referrals (Peach) */}
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    stroke="#fed7aa"
                    strokeWidth="18"
                    strokeDasharray="376"
                    strokeDashoffset="330"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Center Stats */}
                <div className="absolute text-center">
                  <div className="text-xl font-extrabold text-gray-900">4,312</div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Total visitors
                  </div>
                </div>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="flex items-center justify-center gap-4 text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1b564c]" /> Mobile App
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#b6e49e]" /> Web Store
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-200" /> Direct
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Recent orders */}
        <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Recent orders</h3>
              <Link
                to="/orders"
                className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition"
              >
                See all
              </Link>
            </div>

            {/* Orders Table */}
            <div className="mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] font-bold text-gray-400 uppercase border-b border-gray-100 pb-2">
                    <th className="pb-2 font-semibold">Order</th>
                    <th className="pb-2 font-semibold">Time</th>
                    <th className="pb-2 font-semibold">Total</th>
                    <th className="pb-2 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-normal">
                  {recentOrders.map((ord: any) => {
                    const statusClass =
                      ord.status === "shipped"
                        ? "bg-[#eaf5e9] text-[#24613b]"
                        : ord.status === "pending"
                        ? "bg-[#ffedd5] text-[#9a3412]"
                        : "bg-[#eff6ff] text-[#1d4ed8]";

                    const statusLabel =
                      ord.status === "shipped"
                        ? "Shipped"
                        : ord.status === "pending"
                        ? "Process"
                        : "Deliver";

                    const orderNumber = ord.id.slice(0, 5).replace("-", "");

                    return (
                      <tr key={ord.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-2.5 font-bold text-gray-800">
                          #{orderNumber}
                        </td>
                        <td className="py-2.5 text-gray-400 text-[11px]">
                          {ord.time || "2 min ago"}
                        </td>
                        <td className="py-2.5 font-bold text-gray-900">
                          ₵{(ord.totalGHS || ord.total || 24.5).toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
