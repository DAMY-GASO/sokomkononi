// ============================================================
// StatCard.jsx
// Kadi ya statistic kwa Overview section.
// Responsive: inafanya kazi kwenye grid-cols-2 ya simu.
// ============================================================

import React from "react";

export default function StatCard({ label, value, change, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3.5 sm:p-5 min-w-0">
      <div className="flex items-start justify-between gap-2">
        {/* Left: label + value + change */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-sm text-gray-500 font-medium leading-tight line-clamp-2">
            {label}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-gray-800 mt-1 break-words">
            {value}
          </p>
          {change && (
            <p className="text-[10px] sm:text-xs text-green-600 mt-1 truncate">
              {change}
            </p>
          )}
        </div>

        {/* Right: icon */}
        <div
          style={{ background: `${color}15` }}
          className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
        >
          <Icon size={18} color={color} className="sm:hidden" />
          <Icon size={22} color={color} className="hidden sm:block" />
        </div>
      </div>
    </div>
  );
}
