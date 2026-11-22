// ============================================================
// StatTile.jsx
// Kadi ndogo ya stat kwa Seller/Buyer Overview.
// Kila kitu centered: icon, value, label.
// ============================================================

import React from "react";
import { COLORS } from "../components/shared";

export default function StatTile({
  label,
  value,
  icon: Icon,
  color,
  onClick,
  size = "md",
}) {
  const isClickable = Boolean(onClick);
  const padding = size === "sm" ? "p-3" : "p-3.5 sm:p-4";
  const iconSize = size === "sm" ? 16 : 18;
  const iconBox = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const valueSize =
    size === "sm" ? "text-base sm:text-lg" : "text-lg sm:text-2xl";
  const labelSize = "text-body-sm";

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-100 ${padding} min-w-0 transition-all flex flex-col items-center text-center ${
        isClickable
          ? "cursor-pointer hover:shadow-md hover:border-gray-200"
          : ""
      }`}
    >
      {/* Icon — centered */}
      <div
        style={{ background: `${color}15` }}
        className={`${iconBox} rounded-lg flex items-center justify-center shrink-0 mb-2`}
      >
        <Icon size={iconSize} color={color} />
      </div>

      {/* Value — centered */}
      <p className={`${valueSize} font-bold text-primary break-words`}>
        {value}
      </p>

      {/* Label — centered */}
      <p
        className={`${labelSize} text-secondary leading-tight mt-0.5 line-clamp-2`}
      >
        {label}
      </p>
    </div>
  );
}
