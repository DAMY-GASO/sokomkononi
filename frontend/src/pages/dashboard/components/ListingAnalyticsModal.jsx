// ============================================================
// src/pages/dashboard/components/ListingAnalyticsModal.jsx
//
// Modal ya analytics kwa listing moja.
//
// Kumbuka: backend HAIKUWA na endpoint ya "views over time".
// Tunaonyesha data inayopatikana kutoka listing object:
//   - views_count (total views)
//   - inquiries (kutoka leads)
//   - reservationCount
//   - Conversion rate
//
// Wakati backend itakapokuwa na `/listings/{id}/analytics/`,
// modal itaitumia automatically.
// ============================================================
import React, { useEffect, useState } from "react";
import {
  X, Eye, MessageSquare, CalendarCheck, TrendingUp,
  Clock, Loader2, BarChart3, ExternalLink,
} from "lucide-react";
import { COLORS, timeAgo, formatTZS } from "./shared.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { api } from "../../../api/client.js";

export default function ListingAnalyticsModal({ listingId, listing, lang, onClose }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    let cancelled = false;
    setLoading(true);
    setStats(null);

    (async () => {
      // Jaribu endpoint ya backend kwanza (kama ipo)
      let backendStats = null;
      try {
        backendStats = await api.get(`/listings/${listingId}/analytics/`);
      } catch (err) {
        // Fallback — backend haina endpoint bado
      }

      if (cancelled) return;

      if (backendStats && typeof backendStats === "object") {
        setStats(backendStats);
      } else if (listing) {
        // Tumia data iliyopo kwenye listing object
        const views = Number(listing.views) || 0;
        const inquiries = Number(listing.inquiries) || 0;
        const reservations = Number(listing.reservationCount) || 0;
        setStats({
          total_views: views,
          total_inquiries: inquiries,
          total_reservations: reservations,
          conversion_rate: views > 0 ? (inquiries / views) * 100 : 0,
          fallback: true,
        });
      } else {
        setStats({
          total_views: 0,
          total_inquiries: 0,
          total_reservations: 0,
          conversion_rate: 0,
          fallback: true,
        });
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [listingId, listing]);

  if (!listingId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
              style={{ background: "rgba(232,163,61,0.15)", color: COLORS.goldInk }}
            >
              <BarChart3 size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-primary">
                {t("Analytics", "Analytics")}
              </h2>
              <p className="text-[11px] text-secondary truncate">
                {listing?.title || ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("Funga", "Close")}
            className="shrink-0 text-muted hover:text-secondary p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 size={24} className="animate-spin" color={COLORS.gold} />
            <p className="text-xs text-secondary">
              {t("Inapakia...", "Loading...")}
            </p>
          </div>
        )}

        {/* Stats grid */}
        {!loading && stats && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: "rgba(232,163,61,0.08)" }}
              >
                <Eye size={14} className="mx-auto mb-1" color={COLORS.goldInk} />
                <p className="text-lg font-bold text-primary tabular-nums">
                  {(stats.total_views || 0).toLocaleString()}
                </p>
                <p className="text-[9px] font-semibold text-secondary uppercase tracking-wider">
                  {t("Mionekano", "Views")}
                </p>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: "rgba(37,99,235,0.08)" }}
              >
                <MessageSquare size={14} className="mx-auto mb-1" color="#2563EB" />
                <p className="text-lg font-bold text-primary tabular-nums">
                  {(stats.total_inquiries || 0).toLocaleString()}
                </p>
                <p className="text-[9px] font-semibold text-secondary uppercase tracking-wider">
                  {t("Maulizio", "Inquiries")}
                </p>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: "rgba(47,109,79,0.08)" }}
              >
                <CalendarCheck size={14} className="mx-auto mb-1" color={COLORS.green} />
                <p className="text-lg font-bold text-primary tabular-nums">
                  {(stats.total_reservations || 0).toLocaleString()}
                </p>
                <p className="text-[9px] font-semibold text-secondary uppercase tracking-wider">
                  {t("Reservations", "Reservations")}
                </p>
              </div>
            </div>

            {/* Conversion rate */}
            {stats.total_views > 0 && (
              <div
                className="rounded-xl p-3 text-xs mb-3"
                style={{ background: "rgba(47,109,79,0.06)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-secondary">
                    {t("Kiwango cha ubadilishaji", "Conversion rate")}
                  </span>
                  <span className="font-bold tabular-nums" style={{ color: COLORS.green }}>
                    {(stats.conversion_rate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, stats.conversion_rate || 0)}%`,
                      background: COLORS.green,
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted mt-1">
                  {t("Maulizio ÷ Mionekano", "Inquiries ÷ Views")}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div
              className="rounded-xl border p-3 text-[11px] space-y-1"
              style={{ borderColor: COLORS.sandLine }}
            >
              {listing?.postedAt && (
                <div className="flex items-center gap-1.5 text-secondary">
                  <Clock size={10} />
                  <span>
                    {t("Iliwekwa", "Posted")}: {timeAgo(listing.postedAt, lang)}
                  </span>
                </div>
              )}
              {listing?.price > 0 && (
                <div className="flex items-center gap-1.5 text-secondary">
                  <TrendingUp size={10} />
                  <span>
                    {t("Bei", "Price")}: {formatTZS(listing.price)}
                  </span>
                </div>
              )}
            </div>

            {/* Fallback note */}
            {stats.fallback && (
              <p className="text-[10px] text-muted text-center mt-3 leading-relaxed">
                {t(
                  "Analytics ya kina (mionekano kwa siku) itapatikana hivi karibuni.",
                  "Detailed analytics (views over time) will be available soon."
                )}
              </p>
            )}
          </>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
          >
            {t("Funga", "Close")}
          </button>
          {listing &&
            ["live", "reserved", "sold", "paused"].includes(
              String(listing.status).toLowerCase()
            ) && (
              <a
                href={`/mali/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
                style={{ background: COLORS.gold, color: COLORS.night }}
              >
                <ExternalLink size={12} />
                {t("Angalia Mali", "View Listing")}
              </a>
            )}
        </div>
      </div>
    </div>
  );
}