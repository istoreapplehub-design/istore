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
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-gray-900">{value}</div>
        {trend && (
          <div
            className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
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

      {sublabel && <p className="mt-1 text-xs text-gray-500">{sublabel}</p>}
    </div>
  );
}

export default StatCard;
