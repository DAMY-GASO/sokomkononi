// ============================================================
// ListingViewsChart.jsx
// Chart ndogo ya "Views kwa Listing" — SVG pekee (hakuna library ya nje).
// Inaonyesha top N listings kwa views, horizontal bar chart.
// ============================================================

import React, { useMemo } from "react";
import { Eye, TrendingUp } from "lucide-react";
import { COLORS } from "./shared.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";

const MAX_BARS = 5;
const MIN_BAR_PCT = 4; // asilimia ya chini kabisa ya bar (isifichwe kabisa)

function compactNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export default function ListingViewsChart({ listings }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const topListings = useMemo(() => {
    return (listings || [])
      .filter((l) => l.status === "live" && (l.views || 0) > 0)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, MAX_BARS);
  }, [listings]);

  const maxViews = topListings[0]?.views || 1;

  if (topListings.length === 0) {
    return (
      <div
        className="rounded-xl border p-6 text-center"
        style={{ borderColor: COLORS.sandLine, background: "white" }}
      >
        <Eye size={28} className="mx-auto mb-2" color="rgba(16,26,46,0.25)" />
        <p className="text-sm font-semibold text-primary">
          {t("Hakuna mionekano bado", "No views yet")}
        </p>
        <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
          {t(
            "Mali zako zikianza kuonekana, mionekano itaonekana hapa.",
            "Once buyers start viewing your listings, views will show here."
          )}
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-4 sm:p-5"
      style={{ borderColor: COLORS.sandLine, background: "white" }}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Eye size={16} color={COLORS.gold} />
          <h2 className="h-card">
            {t("Mionekano kwa Mali", "Views per Listing")}
          </h2>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: "rgba(232,163,61,0.15)", color: "#8A5A16" }}
        >
          <TrendingUp size={10} className="inline -mt-0.5 mr-1" />
          Top {topListings.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {topListings.map((l) => {
          const pct = Math.max(
            MIN_BAR_PCT,
            Math.round(((l.views || 0) / maxViews) * 100)
          );
          return (
            <div key={l.id}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-primary truncate flex-1 min-w-0">
                  {l.title || t("Bila jina", "Untitled")}
                </span>
                <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: COLORS.goldInk }}>
                  {compactNumber(l.views || 0)}
                </span>
              </div>
              <div
                className="h-2.5 rounded-full overflow-hidden"
                style={{ background: "rgba(16,26,46,0.06)" }}
                role="img"
                aria-label={`${l.title || "Listing"}: ${l.views || 0} views`}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${pct}%`,
                    background:
                      "linear-gradient(90deg, #FEA406 0%, #FD8706 100%)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted mt-3 text-center">
        {t(
          "Mionekano huhesabiwa kila mtumiaji anapofungua ukurasa wa mali.",
          "Views are counted each time a user opens a property page."
        )}
      </p>
    </div>
  );
}