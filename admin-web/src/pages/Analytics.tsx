import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Layers,
  BarChart3,
  Trophy,
  CreditCard,
  Boxes
} from "lucide-react";
import { getRevenueStats, getAdminProductStats, formatGHS } from "../lib/api";
import { ApiError, Empty } from "../components/StatePanels";

type Period = "today" | "7d" | "30d" | "all";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "all", label: "All Time" }
];

const CHANNEL_LABELS: Record<string, string> = {
  mobile_money: "Mobile money",
  card: "Card",
  bank: "Bank transfer"
};

function dayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short" });
}

function fullDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  });
}

function KpiCard({
  label,
  value,
  meta,
  icon
}: {
  label: string;
  value: string;
  meta: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#ebebe9] shadow-xs">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
        <span>{label}</span>
        <span className="text-neutral-900">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">{value}</div>
      <div className="mt-2 text-xs font-medium text-gray-500 leading-relaxed">{meta}</div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  children,
  className = ""
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl p-6 border border-[#ebebe9] shadow-xs ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          {subtitle ? <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p> : null}
        </div>
        {icon ? <span className="text-neutral-900">{icon}</span> : null}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export function Analytics() {
  const [period, setPeriod] = useState<Period>("30d");

  const {
    data: rev,
    isLoading: loadingRev,
    isError: revError,
    error: revErrorObj,
    refetch: refetchRev
  } = useQuery({
    queryKey: ["revenue-analytics", period],
    queryFn: () => getRevenueStats(period)
  });

  const {
    data: prodStats,
    isError: prodError,
    error: prodErrorObj,
    refetch: refetchProd
  } = useQuery({
    queryKey: ["product-stats"],
    queryFn: getAdminProductStats
  });

  const dailyData = (rev?.byDay ?? []).slice(-14);
  const maxDaily = Math.max(...dailyData.map((d) => d.revenueGHS), 0);

  const peakDay = dailyData.reduce(
    (best, d) => (d.revenueGHS > (best?.revenueGHS ?? 0) ? d : best),
    dailyData[0]
  );

  const tradingDays = dailyData.filter((d) => d.revenueGHS > 0);
  const averagePerActiveDay =
    tradingDays.length > 0
      ? tradingDays.reduce((sum, d) => sum + d.revenueGHS, 0) / tradingDays.length
      : 0;

  const categoryRows = Object.entries(prodStats?.byCategory ?? {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const categoryTotal = categoryRows.reduce((sum, c) => sum + c.count, 0);

  const topSellers = rev?.topProducts ?? [];
  const topSellersRevenue = topSellers.reduce((sum, p) => sum + p.revenueGHS, 0);

  const channels = Object.entries(rev?.byChannel ?? {}).map(([key, value]) => ({
    key,
    label: CHANNEL_LABELS[key] || key,
    count: value.count,
    revenueGHS: value.revenueGHS
  }));
  const channelOrders = channels.reduce((sum, c) => sum + c.count, 0);

  if (revError) {
    return (
      <div className="bg-white rounded-2xl border border-[#ebebe9] shadow-xs">
        <ApiError message={(revErrorObj as Error)?.message} onRetry={refetchRev} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ─── HEADER & PERIOD SELECTOR ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Store Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Computed from settled orders (paid, shipped, delivered) in the database.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#ebebe9] rounded-full shadow-xs self-start sm:self-auto">
          {PERIODS.map((p) => {
            const isSelected = period === p.value;
            return (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition ${
                  isSelected
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-gray-600 hover:text-black hover:bg-gray-100"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {loadingRev ? (
        <div className="bg-white rounded-2xl border border-[#ebebe9] shadow-xs py-20 text-center text-xs font-semibold text-gray-400 animate-pulse">
          Loading store analytics…
        </div>
      ) : !rev ? null : (
        <>
          {/* ─── KPI CARDS ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Gross Sales"
              value={formatGHS(rev.revenueGHS)}
              icon={<DollarSign className="w-4 h-4" />}
              meta={
                rev.orderCount > 0
                  ? `${rev.orderCount} settled order${rev.orderCount === 1 ? "" : "s"} in this range`
                  : "No settled orders in this range"
              }
            />

            <KpiCard
              label="Completed Orders"
              value={String(rev.orderCount)}
              icon={<ShoppingBag className="w-4 h-4" />}
              meta="Paid, shipped or delivered"
            />

            <KpiCard
              label="Average Order Value"
              value={formatGHS(rev.avgOrderValueGHS)}
              icon={<TrendingUp className="w-4 h-4" />}
              meta={
                rev.orderCount > 0
                  ? "Gross sales ÷ settled orders"
                  : "Needs at least one settled order"
              }
            />

            <KpiCard
              label="Catalog Stock Value"
              value={prodStats ? formatGHS(prodStats.totalStockValueGHS) : "—"}
              icon={<Layers className="w-4 h-4" />}
              meta={
                prodStats
                  ? `${prodStats.activeProducts} live of ${prodStats.totalProducts} listings`
                  : "Catalog stats unavailable"
              }
            />
          </div>

          {/* ─── REVENUE BY DAY + CATALOG MIX ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <Panel
              title="Revenue By Day"
              subtitle={`Settled order revenue across the last ${dailyData.length} days of this range`}
              icon={<BarChart3 className="w-4 h-4" />}
              className="lg:col-span-8"
            >
              {maxDaily === 0 ? (
                <Empty>
                  No settled orders in this period. Paid, shipped or delivered orders will draw this
                  chart.
                </Empty>
              ) : (
                <>
                  <div className="overflow-x-auto pb-2 -mx-2 px-2">
                    <div className="h-56 min-w-[320px] sm:min-w-0 flex items-end justify-between gap-2 sm:gap-4 border-b border-gray-100 pb-2">
                      {dailyData.map((d) => {
                        const heightPct = (d.revenueGHS / maxDaily) * 100;
                        return (
                          <div
                            key={d.date}
                            className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                          >
                            <div
                              title={`${formatGHS(d.revenueGHS)} · ${d.orderCount} order${
                                d.orderCount === 1 ? "" : "s"
                              }`}
                              style={{ height: `${d.revenueGHS > 0 ? Math.max(heightPct, 4) : 1}%` }}
                              className={`w-full max-w-[34px] rounded-t-lg transition duration-200 ${
                                d.revenueGHS > 0
                                  ? "bg-neutral-900 hover:bg-neutral-700 cursor-pointer"
                                  : "bg-gray-100"
                              }`}
                            />
                            <span className="text-[10px] font-semibold text-gray-400 mt-1">
                              {dayLabel(d.date)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <span>
                      Peak day:{" "}
                      <strong className="text-gray-900">
                        {formatGHS(peakDay?.revenueGHS ?? 0)} ({fullDate(peakDay?.date ?? "")})
                      </strong>
                    </span>
                    <span>
                      Average:{" "}
                      <strong className="text-gray-900">
                        {formatGHS(averagePerActiveDay)} / trading day
                      </strong>{" "}
                      ({tradingDays.length} of {dailyData.length} days)
                    </span>
                  </div>
                </>
              )}
            </Panel>

            <Panel
              title="Catalog Mix"
              subtitle="Listings per category, straight from the product table"
              icon={<Boxes className="w-4 h-4" />}
              className="lg:col-span-4"
            >
              {prodError ? (
                <ApiError message={(prodErrorObj as Error)?.message} onRetry={refetchProd} />
              ) : categoryRows.length === 0 ? (
                <Empty>No products in the catalog yet.</Empty>
              ) : (
                <div className="space-y-4">
                  {categoryRows.map((cat) => {
                    const pct = categoryTotal > 0 ? (cat.count / categoryTotal) * 100 : 0;
                    return (
                      <div key={cat.name}>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                          <span className="text-gray-900">{cat.name}</span>
                          <span className="text-gray-500">
                            {cat.count} listing{cat.count === 1 ? "" : "s"} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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

          {/* ─── BEST SELLERS + CHANNELS ────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <Panel
              title="Best Sellers"
              subtitle="Top line items by settled revenue in this range"
              icon={<Trophy className="w-4 h-4" />}
              className="lg:col-span-7"
            >
              {topSellers.length === 0 ? (
                <Empty>
                  No sold line items yet — best sellers appear once an order is paid.
                </Empty>
              ) : (
                <div className="space-y-4">
                  {topSellers.map((p) => {
                    const share =
                      topSellersRevenue > 0 ? (p.revenueGHS / topSellersRevenue) * 100 : 0;
                    return (
                      <div key={p.productId}>
                        <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                          <span className="text-gray-900 truncate">{p.name}</span>
                          <span className="text-gray-500 whitespace-nowrap">
                            {p.unitsSold} unit{p.unitsSold === 1 ? "" : "s"} ·{" "}
                            {formatGHS(p.revenueGHS)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${share}%` }}
                            className="h-full bg-neutral-900 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel
              title="Settlement Channels"
              subtitle="Payment channel recorded on each settled order"
              icon={<CreditCard className="w-4 h-4" />}
              className="lg:col-span-5"
            >
              {channelOrders === 0 ? (
                <Empty>No settled orders to split by channel in this range.</Empty>
              ) : (
                <div className="space-y-3">
                  {channels
                    .filter((c) => c.count > 0)
                    .sort((a, b) => b.count - a.count)
                    .map((c) => {
                      const pct = (c.count / channelOrders) * 100;
                      return (
                        <div
                          key={c.key}
                          className="p-4 bg-neutral-50 rounded-xl border border-neutral-200"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase">
                              {c.label}
                            </span>
                            <span className="text-xs font-bold text-neutral-900">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                          <div className="text-xl font-extrabold text-neutral-900 mt-1">
                            {c.count} order{c.count === 1 ? "" : "s"}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {formatGHS(c.revenueGHS)} settled
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;
