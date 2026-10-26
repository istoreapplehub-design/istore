import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Boxes,
  Package,
  RefreshCw,
  ShoppingBag,
  Wallet
} from "lucide-react";
import {
  formatGHS,
  getAdminOrders,
  getAdminProducts,
  getRevenueStats,
  timeAgo
} from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { StatusBadge } from "../components/StatusBadge";
import { ApiError, Empty } from "../components/StatePanels";

type Period = "today" | "7d" | "30d" | "all";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" }
];

const CHANNELS = [
  { key: "mobile_money", label: "Mobile money", color: "#171717" },
  { key: "card", label: "Card", color: "#737373" },
  { key: "bank", label: "Bank transfer", color: "#d4d4d4" }
];

const LOW_STOCK_THRESHOLD = 5;

/** Normalised polyline through real daily revenue points. */
function sparkPath(values: number[], width: number, height: number): string {
  if (values.length < 2) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function Panel({
  title,
  subtitle,
  action,
  className = "",
  children
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white/85 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] transition-all duration-300 flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-neutral-900 text-sm tracking-tight">{title}</h3>
          {subtitle ? <div className="text-[11px] text-neutral-400 mt-0.5 font-medium">{subtitle}</div> : null}
        </div>
        {action}
      </div>
      <div className="flex-1 mt-4">{children}</div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>("7d");
  const [productSort, setProductSort] = useState<"revenue" | "volume">("revenue");

  const {
    data: rev,
    isLoading: loadingRev,
    isError: revError,
    error: revErr
  } = useQuery({
    queryKey: ["revenue-stats", period],
    queryFn: () => getRevenueStats(period)
  });

  const { data: productsData, isError: productsError } = useQuery({
    queryKey: ["admin-products-all"],
    queryFn: () => getAdminProducts({ limit: 100 })
  });

  const { data: recentOrdersData, isError: ordersError } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: () => getAdminOrders({ page: 1, limit: 5 })
  });

  const productRows = productsData?.data;
  const products = productRows ?? [];
  const recentOrders = recentOrdersData?.data ?? [];

  const stockById = useMemo(
    () => new Map((productRows ?? []).map((p) => [p.id, p.stock])),
    [productRows]
  );

  const dailyValues = (rev?.byDay ?? []).map((d) => d.revenueGHS);
  const peakDay = Math.max(...dailyValues, 0);

  const inventoryAlerts = useMemo(
    () =>
      (productRows ?? [])
        .filter((p) => p.isActive && p.stock < LOW_STOCK_THRESHOLD)
        .sort((a, b) => a.stock - b.stock),
    [productRows]
  );

  const topProducts = useMemo(() => {
    const list = [...(rev?.topProducts ?? [])];
    list.sort((a, b) =>
      productSort === "volume" ? b.unitsSold - a.unitsSold : b.revenueGHS - a.revenueGHS
    );
    return list.slice(0, 5);
  }, [rev, productSort]);
  const topProductPeak = topProducts[0]?.revenueGHS ?? 0;

  const channelTotal = CHANNELS.reduce(
    (sum, channel) => sum + (rev?.byChannel?.[channel.key]?.count ?? 0),
    0
  );

  const todayLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  const retryAll = () => {
    queryClient.invalidateQueries();
  };

  const metrics = [
    {
      label: "Revenue",
      value: rev ? formatGHS(rev.revenueGHS) : "—",
      sub: `${PERIODS.find((p) => p.value === period)?.label ?? ""} · paid orders only`,
      icon: Wallet,
      spark: dailyValues
    },
    {
      label: "Paid orders",
      value: rev ? rev.orderCount.toLocaleString() : "—",
      sub: rev ? `${rev.orderCount} settled in this period` : "Loading…",
      icon: ShoppingBag,
      spark: (rev?.byDay ?? []).map((d) => d.orderCount)
    },
    {
      label: "Average order",
      value: rev ? formatGHS(rev.avgOrderValueGHS) : "—",
      sub: rev && rev.orderCount > 0 ? "Revenue ÷ paid orders" : "Needs at least one paid order",
      icon: ArrowUpRight,
      spark: dailyValues
    },
    {
      label: "Live products",
      value: productsData?.stats
        ? `${productsData.stats.activeCount} / ${productsData.stats.totalCount}`
        : "—",
      sub: productsData?.stats
        ? `${productsData.stats.outOfStockCount} out of stock · ${productsData.stats.lowStockCount} low`
        : "Loading…",
      icon: Package,
      spark: []
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ─── GREETING + PERIOD ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717] tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "Admin"}
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">{todayLabel}</p>
        </div>

        <div className="inline-flex items-center p-1 bg-white border border-[#ebebe9] rounded-full shadow-xs">
          {PERIODS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition ${
                period === option.value
                  ? "bg-neutral-900 text-white"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {revError ? (
        <div className="bg-white rounded-2xl border border-[#ebebe9] shadow-xs px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-700 min-w-0">
            <span className="font-semibold text-gray-900">Store API unreachable. </span>
            {revErr instanceof Error ? revErr.message : "Numbers below are unavailable."}
          </div>
          <button
            type="button"
            onClick={retryAll}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 text-xs font-semibold text-neutral-900 border border-neutral-200 rounded-full hover:bg-neutral-100 transition shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : null}

      {/* ─── METRIC CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const path = sparkPath(metric.spark, 80, 22);
          return (
            <div
              key={metric.label}
              className="bg-white/85 backdrop-blur-md rounded-2xl p-5 border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-neutral-300/90 transition-all duration-300 group flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{metric.label}</span>
                <div className="w-8 h-8 rounded-xl bg-neutral-100/90 flex items-center justify-center text-neutral-800 transition-transform group-hover:scale-105 duration-300">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-neutral-900 tracking-tight">
                {loadingRev && metric.label !== "Live products" ? "…" : metric.value}
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <span className="text-[11px] text-neutral-400 font-medium leading-tight">
                  {metric.sub}
                </span>
                {path ? (
                  <svg className="w-20 h-6 overflow-visible shrink-0" viewBox="0 0 80 22">
                    <path d={path} stroke="#171717" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  </svg>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── SALES TREND + TOP PRODUCTS ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#ebebe9] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Revenue by day
              </span>
              <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {rev ? formatGHS(rev.revenueGHS) : "—"}
              </div>
            </div>
            <div className="text-[11px] text-gray-400 font-medium">
              {rev ? `${rev.byDay.length} days shown · peak ${formatGHS(peakDay)}` : "Loading…"}
            </div>
          </div>

          {revError ? (
            <ApiError message={revErr instanceof Error ? revErr.message : undefined} onRetry={retryAll} />
          ) : peakDay === 0 ? (
            <Empty>
              No paid orders in this period. Switch the range above or check back once
              checkout activity lands.
            </Empty>
          ) : (
            <>
              <div className="mt-8 h-56 flex items-end justify-between gap-1 sm:gap-2 border-b border-gray-100 pb-2">
                {rev!.byDay.map((day) => {
                  const pct = peakDay ? (day.revenueGHS / peakDay) * 100 : 0;
                  return (
                    <div
                      key={day.date}
                      className="flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0"
                      title={`${day.date}: ${formatGHS(day.revenueGHS)} · ${day.orderCount} orders`}
                    >
                      <div
                        style={{ height: `${Math.max(pct, day.revenueGHS > 0 ? 3 : 0)}%` }}
                        className={`w-full max-w-[26px] rounded-t-md transition-all duration-300 ${
                          day.revenueGHS > 0 ? "bg-neutral-900" : "bg-neutral-100"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold pt-2">
                <span>{rev!.byDay[0]?.date ?? ""}</span>
                <span>{formatGHS(peakDay)}</span>
                <span>{rev!.byDay[rev!.byDay.length - 1]?.date ?? ""}</span>
              </div>
            </>
          )}
        </div>

        <Panel
          className="lg:col-span-5"
          title="Top sellers"
          subtitle={rev ? `${topProducts.length} products with settled revenue` : "Loading…"}
          action={
            <select
              value={productSort}
              onChange={(event) => setProductSort(event.target.value as "revenue" | "volume")}
              className="appearance-none pl-2.5 pr-6 py-1 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-full cursor-pointer outline-none"
            >
              <option value="revenue">By revenue</option>
              <option value="volume">By volume</option>
            </select>
          }
        >
          {topProducts.length === 0 ? (
            <Empty>No product has been sold in this period yet.</Empty>
          ) : (
            <div className="divide-y divide-gray-100">
              {topProducts.map((product) => {
                const pct = topProductPeak
                  ? Math.round((product.revenueGHS / topProductPeak) * 100)
                  : 0;
                const stock = stockById.get(product.productId);
                return (
                  <div key={product.productId} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {product.name}
                      </span>
                      <span className="text-xs font-bold text-gray-900 shrink-0">
                        {formatGHS(product.revenueGHS)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                      <span>{product.unitsSold} sold</span>
                      <span>·</span>
                      <span>{stock === undefined ? "stock unavailable" : `${stock} in stock`}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-neutral-900 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* ─── INVENTORY / PAYMENT MIX / RECENT ORDERS ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Panel
          title="Inventory alerts"
          subtitle={
            productsError
              ? "Inventory unavailable"
              : `${inventoryAlerts.length} live products under ${LOW_STOCK_THRESHOLD} units`
          }
          action={
            <Link
              to="/products"
              className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition"
            >
              See all
            </Link>
          }
        >
          {productsError ? (
            <ApiError onRetry={retryAll} />
          ) : inventoryAlerts.length === 0 ? (
            <Empty>Every live product is stocked above the alert threshold.</Empty>
          ) : (
            <div className="space-y-3">
              {inventoryAlerts.slice(0, 4).map((product) => {
                const critical = product.stock === 0;
                const filled = Math.max(product.stock, 0);
                return (
                  <div
                    key={product.id}
                    className="p-3 bg-neutral-50 rounded-xl border border-neutral-100"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-bold text-neutral-900">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            critical ? "bg-neutral-900" : "bg-neutral-400"
                          }`}
                        />
                        {critical ? "Out of stock" : "Low stock"}
                      </span>
                      <span className="font-bold text-neutral-900">{product.stock} left</span>
                    </div>
                    <div className="mt-1.5 text-xs font-bold text-gray-900 truncate">
                      {product.name}
                    </div>
                    <div className="text-[11px] text-gray-400">{product.category}</div>
                    <div className="mt-2 flex items-center gap-1">
                      {Array.from({ length: LOW_STOCK_THRESHOLD }).map((_, index) => (
                        <div
                          key={index}
                          className={`flex-1 h-1 rounded-full ${
                            index < filled ? "bg-neutral-900" : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title="Payment mix"
          subtitle={channelTotal ? `${channelTotal} settled orders` : "No settled orders yet"}
        >
          {revError ? (
            <ApiError onRetry={retryAll} />
          ) : channelTotal === 0 ? (
            <Empty>
              Nothing has been paid through Paystack in this period, so there is no channel split
              to show.
            </Empty>
          ) : (
            <>
              <div className="my-2 flex items-center justify-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="60" stroke="#f3f4f6" strokeWidth="18" fill="transparent" />
                    {(() => {
                      const circumference = 2 * Math.PI * 60;
                      let consumed = 0;
                      return CHANNELS.map((channel) => {
                        const count = rev?.byChannel?.[channel.key]?.count ?? 0;
                        const length = (count / channelTotal) * circumference;
                        const offset = -consumed;
                        consumed += length;
                        if (count === 0) return null;
                        return (
                          <circle
                            key={channel.key}
                            cx="80"
                            cy="80"
                            r="60"
                            stroke={channel.color}
                            strokeWidth="18"
                            fill="transparent"
                            strokeDasharray={`${length} ${circumference - length}`}
                            strokeDashoffset={offset}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-xl font-extrabold text-gray-900">{channelTotal}</div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Orders
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                {CHANNELS.map((channel) => {
                  const entry = rev?.byChannel?.[channel.key];
                  const count = entry?.count ?? 0;
                  const share = channelTotal ? Math.round((count / channelTotal) * 100) : 0;
                  return (
                    <div
                      key={channel.key}
                      className="flex items-center justify-between text-[11px] font-medium"
                    >
                      <span className="flex items-center gap-2 text-gray-600">
                        <span className="w-2 h-2 rounded-full" style={{ background: channel.color }} />
                        {channel.label}
                      </span>
                      <span className="text-gray-900 font-bold">
                        {count} · {share}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Panel>

        <Panel
          title="Recent orders"
          subtitle={
            recentOrdersData
              ? `${recentOrdersData.meta.total} order${recentOrdersData.meta.total === 1 ? "" : "s"} total`
              : "Loading…"
          }
          action={
            <Link
              to="/orders"
              className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition"
            >
              See all
            </Link>
          }
        >
          {ordersError ? (
            <ApiError onRetry={retryAll} />
          ) : recentOrders.length === 0 ? (
            <Empty>No orders have been placed yet.</Empty>
          ) : (
            <div className="space-y-1">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 rounded-lg px-1 -mx-1 transition"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-800 truncate">
                      #{order.id.slice(0, 8).replace("-", "")}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {order.user?.name || "Guest"} · {timeAgo(order.createdAt)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-gray-900">
                      {formatGHS(order.totalGHS)}
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ─── QUICK ACTIONS ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs flex flex-wrap items-center gap-3">
        <Boxes className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Quick actions
        </span>
        <Link
          to="/products/new"
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded-full hover:bg-black transition"
        >
          Add product
        </Link>
        <Link
          to="/orders"
          className="px-3.5 py-1.5 text-xs font-semibold text-neutral-900 border border-neutral-200 rounded-full hover:bg-neutral-100 transition"
        >
          Fulfil orders
        </Link>
        <Link
          to="/analytics"
          className="px-3.5 py-1.5 text-xs font-semibold text-neutral-900 border border-neutral-200 rounded-full hover:bg-neutral-100 transition"
        >
          View analytics
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
