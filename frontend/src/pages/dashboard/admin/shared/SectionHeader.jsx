import React from "react";
import { FONTS } from "./constants.js";

export default function SectionHeader({ title, subtitle, eyebrow, action }) {
  return (
    <header className="mb-6">
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#A35F00" }}>
          <span className="inline-block h-px w-5 bg-current" />
          {eyebrow}
        </span>
      )}
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 style={{ fontFamily: FONTS.display }} className="text-[clamp(1.375rem,2.4vw,1.75rem)] font-bold leading-tight tracking-tight text-primary">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-secondary">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
