// ============================================================
// RecentActivity.jsx
// Recent activity — inahesabu events kutoka listings + deals.
// ============================================================

import React, { useMemo } from "react";
import {
  PlusCircle,
  Rocket,
  MessagesSquare,
  Eye,
  CheckCircle,
  Clock3,
  TrendingUp,
} from "lucide-react";
import { COLORS, formatTZS, timeAgo } from "../../shared";
import { useLanguage } from "../../../../context/LanguageContext.jsx";

export default function RecentActivity({ listings, deals, onNavigate, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const activities = useMemo(() => {
    const events = [];

    // Kila listing — ongeza event ya "posted"
    listings.forEach((l) => {
      if (l.postedAt) {
        events.push({
          id: `listing_posted_${l.id}`,
          type: "listing_posted",
          icon: PlusCircle,
          color: COLORS.green,
          title: t(
            `Listing "${l.title}" ilichapishwa`,
            `Listing "${l.title}" was posted`
          ),
          at: l.postedAt,
          onClick: () => onNavigate("listings"),
        });
      }
      if (l.boostExpiresAt && new Date(l.boostExpiresAt) > new Date()) {
        events.push({
          id: `listing_boosted_${l.id}`,
          type: "listing_boosted",
          icon: Rocket,
          color: COLORS.gold,
          title: t(
            `Listing "${l.title}" imeboostiwa`,
            `Listing "${l.title}" was boosted`
          ),
          at: l.boostExpiresAt,
          onClick: () => onNavigate("listings"),
        });
      }
    });

    // Kila deal — ongeza event
    deals.forEach((d) => {
      events.push({
        id: `deal_${d.id}`,
        type: "deal_opened",
        icon: MessagesSquare,
        color: COLORS.rust,
        title: t(
          `Deal Room mpya — "${d.listingTitle}"`,
          `New Deal Room — "${d.listingTitle}"`
        ),
        at: d.messages?.[0]?.at || new Date().toISOString(),
        onClick: () => onNavigate("deals"),
      });
    });

    // Sort kwa tarehe, chukua 5 za hivi karibuni
    return events
      .filter((e) => e.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 5);
  }, [listings, deals, lang, onNavigate]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2
          style={{ color: COLORS.night }}
          className="text-sm font-semibold"
        >
          {t("Shughuli za Hivi Karibuni", "Recent Activity")}
        </h2>
        <button
          onClick={() => onNavigate("listings")}
          className="text-xs font-semibold hover:underline"
          style={{ color: COLORS.gold }}
        >
          {t("Ona Zote →", "View All →")}
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          {t(
            "Hakuna shughuli bado. Anza kwa kuweka mali yako ya kwanza.",
            "No activity yet. Start by posting your first property."
          )}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {activities.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={a.onClick}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div
                  style={{ background: `${a.color}15` }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                >
                  <Icon size={14} color={a.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-700 leading-snug">
                    {a.title}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                    {timeAgo(a.at, lang)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}