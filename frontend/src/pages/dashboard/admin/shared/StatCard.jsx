// ============================================================
// StatCard.jsx
// Kadi ya statistic kwa Overview section.
// ============================================================

import React from "react";

export default function StatCard({ label, value, change, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {change && <p className="text-xs text-green-600 mt-1">{change}</p>}
        </div>
        <div
          style={{ background: `${color}15` }}
          className="w-12 h-12 rounded-xl flex items-center justify-center"
        >
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  );
}
