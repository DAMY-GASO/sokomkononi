import React from "react";

const stats = [
  { value: "5,000+", label: "Wauzaji waliojiunga" },
  { value: "10,000+", label: "Mali zilizowekwa" },
  { value: "2,500+", label: "Deals zilizokamilika" },
];

export default function StatsLedger() {
  return (
    <div className="bg-night-2 text-sand">
      <div className="max-w-6xl mx-auto px-5 py-6 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        {stats.map((s) => (
          <div key={s.label} className="flex-1 py-3 sm:py-0 sm:px-6 first:pl-0">
            <p className="text-xl md:text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="text-sand/60 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
