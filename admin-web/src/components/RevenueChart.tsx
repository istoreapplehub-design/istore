import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { formatGHS } from "../lib/api";

export interface RevenueChartProps {
  data: Array<{ date: string; revenueGHS: number; orderCount: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-gray-400">
        No sales data available yet
      </div>
    );
  }

  const chartData = data.map((item) => {
    let dateLabel = item.date;
    try {
      const d = new Date(item.date);
      dateLabel = d.toLocaleDateString("en-GH", { month: "short", day: "numeric" });
    } catch {
      // fallback
    }

    return {
      date: dateLabel,
      revenue: item.revenueGHS,
      orders: item.orderCount
    };
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#171717" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            dy={8}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            tickFormatter={(val) => (val >= 1000 ? `₵${(val / 1000).toFixed(0)}k` : `₵${val}`)}
            dx={-8}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const val = payload[0].value as number;
                const ord = payload[0].payload.orders as number;
                return (
                  <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-800 shadow-2xl rounded-2xl p-3.5 text-xs text-white min-w-36 animate-in fade-in zoom-in-95 duration-150">
                    <p className="font-medium text-neutral-400 text-[11px]">{label}</p>
                    <p className="text-white font-extrabold text-base mt-1">{formatGHS(val)}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{ord} settled order{ord === 1 ? "" : "s"}</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#171717"
            strokeWidth={2.5}
            activeDot={{ r: 5, fill: "#171717", stroke: "#FFFFFF", strokeWidth: 2 }}
            fillOpacity={1}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueChart;
