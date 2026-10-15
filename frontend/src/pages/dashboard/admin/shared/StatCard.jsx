import React from "react";

function changeColor(change) {
  if (!change) return "text-muted";
  const s = String(change).trim();
  if (s.startsWith("-") || s.startsWith("↓") || s.startsWith("−")) return "text-[#C1502E]";
  return "text-[#2F6D4F]";
}

export default function StatCard({ label, value, change, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card p-3.5 sm:p-5 min-w-0 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-[12px] font-medium leading-tight text-secondary line-clamp-2">{label}</p>
          <p className="mt-1 break-words text-lg font-bold leading-tight text-primary tabular-nums sm:text-2xl">{value}</p>
          {change && <p className={`mt-1 truncate text-[10px] font-medium sm:text-xs ${changeColor(change)}`}>{change}</p>}
        </div>
        {Icon && (
          <span style={{ background: `${color}15`, color }} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg sm:h-12 sm:w-12 sm:rounded-xl">
            <Icon size={18} className="sm:hidden" />
            <Icon size={22} className="hidden sm:block" />
          </span>
        )}
      </div>
    </div>
  );
}
