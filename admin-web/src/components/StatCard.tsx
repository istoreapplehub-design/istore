import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { value: number; positive: boolean };
  sublabel?: string;
}

export function StatCard({
  label,
  value,
  icon,
  iconBg = "bg-neutral-100 text-neutral-900",
  trend,
  sublabel
}: StatCardProps) {
  return (
    <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] hover:border-neutral-300/90 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{label}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 ${iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-3xl font-extrabold tracking-tight text-neutral-900">{value}</div>
        {trend && (
          <div
            className={`flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${
              trend.positive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
            }`}
          >
            {trend.positive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {trend.value}%
          </div>
        )}
      </div>

      {sublabel && <p className="mt-1.5 text-xs text-neutral-400 font-medium">{sublabel}</p>}
    </div>
  );
}

export default StatCard;
