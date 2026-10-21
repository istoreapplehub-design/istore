import React from "react";

interface BrandLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

/**
 * Official I-Dynamics Brand Emblem.
 * Designed with the signature "I·D" geometric architectural monogram
 * with the electric blue dynamic connector node.
 */
export function BrandLogo({
  size = 32,
  className = "",
  showWordmark = false,
  wordmarkClassName = "font-extrabold text-gray-900 tracking-tight text-lg"
}: BrandLogoProps) {
  const badgeRadius = Math.round(size * 0.28);
  const fontSize = Math.round(size * 0.44);
  const dotSize = Math.max(4, Math.round(size * 0.12));

  const badge = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: badgeRadius
      }}
      className={`bg-[#1D1D1F] border border-white/15 shadow-sm flex items-center justify-center shrink-0 select-none ${className}`}
    >
      <div className="flex items-center justify-center gap-0.5 leading-none">
        <span
          style={{ fontSize }}
          className="font-black text-white tracking-tighter"
        >
          I
        </span>
        <span
          style={{
            width: dotSize,
            height: dotSize
          }}
          className="rounded-full bg-[#0066CC] inline-block shrink-0 shadow-[0_0_6px_#0066CC]"
        />
        <span
          style={{ fontSize }}
          className="font-black text-white tracking-tighter"
        >
          D
        </span>
      </div>
    </div>
  );

  if (!showWordmark) {
    return badge;
  }

  return (
    <div className="flex items-center gap-2.5">
      {badge}
      <span className={wordmarkClassName}>I-Dynamics</span>
    </div>
  );
}
