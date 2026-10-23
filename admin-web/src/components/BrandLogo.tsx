import React from "react";

interface BrandLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

/**
 * Official LesTrades Brand Emblem & Wordmark.
 */
export function BrandLogo({
  size = 32,
  className = "",
  showWordmark = false,
  wordmarkClassName = "font-black italic text-[#0465B3] tracking-tight text-lg"
}: BrandLogoProps) {
  const badgeRadius = Math.round(size * 0.24);

  const badge = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: badgeRadius
      }}
      className={`bg-white border border-blue-100 shadow-sm flex items-center justify-center shrink-0 select-none overflow-hidden ${className}`}
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
      <div className="flex flex-col leading-none">
        <span className={wordmarkClassName}>LesTrades</span>
        <span className="text-[9px] font-semibold italic text-[#0465B3] opacity-80 mt-0.5">
          Quality for Less
        </span>
      </div>
    </div>
  );
}
