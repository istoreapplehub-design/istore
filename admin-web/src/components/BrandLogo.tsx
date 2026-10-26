import React from "react";

interface BrandLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

/**
 * Official LesTrades Brand Emblem.
 * Designed with the signature "L·T" geometric architectural monogram
 * with the electric blue dynamic connector node.
 */
export function BrandLogo({
  size = 32,
  className = "",
  showWordmark = false,
  wordmarkClassName = "font-black text-gray-900 tracking-tight text-lg italic"
}: BrandLogoProps) {
  const badgeRadius = Math.round(size * 0.28);

  const badge = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: badgeRadius
      }}
      className={`bg-white border border-[#0066CC]/20 shadow-sm flex items-center justify-center shrink-0 select-none overflow-hidden p-1 ${className}`}
    >
      <img
        src="/lestrades-emblem.png"
        alt="LesTrades"
        className="w-full h-full object-contain"
      />
    </div>
  );

  if (!showWordmark) {
    return badge;
  }

  return (
    <div className="flex items-center gap-2.5">
      {badge}
      <div className="flex flex-col">
        <span className={wordmarkClassName}>LesTrades</span>
        <span className="text-[10px] font-semibold text-[#0066CC] italic tracking-wide -mt-1">
          Quality for Less
        </span>
      </div>
    </div>
  );
}
