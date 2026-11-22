import React from "react";
import { FONTS } from "./constants.js";

// Vichwa vya sehemu zote za admin viko katikati (centered).
export default function SectionHeader({ title, subtitle, eyebrow, action }) {
  return (
    <header className="mb-6 flex flex-col items-center text-center">
      {eyebrow && (
        <span className="inline-flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "rgb(var(--c-gold-ink))" }}>
          <span className="inline-block h-px w-5 bg-current" />
          {eyebrow}
          <span className="inline-block h-px w-5 bg-current" />
        </span>
      )}
      <div className="mt-1 flex w-full min-w-0 flex-col items-center gap-3">
        <div className="min-w-0">
          <h1 style={{ fontFamily: FONTS.display }} className="text-[clamp(1.375rem,2.4vw,1.75rem)] font-bold leading-tight tracking-tight text-primary">{title}</h1>
          {subtitle && <p className="mx-auto mt-1.5 max-w-2xl text-sm leading-relaxed text-secondary">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">{action}</div>}
      </div>
    </header>
  );
}