// ============================================================
// RecentActivity.jsx
// Shughuli za hivi karibuni — kwa Muuzaji (seller) na Mnunuzi (buyer).
// Inasoma moja kwa moja kutoka stores halisi (listings, deals,
// transactions, saved) — sawa na jinsi DealRooms.jsx inavyotumia
// `side` prop kuamua mtazamo.
//
// MAHALI: weka faili hii kwenye
//   src/pages/dashboard/components/RecentActivity.jsx
// (badala ya seller/RecentActivity.jsx) ili SellerOverview.jsx
// NA BuyerOverview.jsx zote ziweze kuitumia.
// ============================================================

import React from "react";
import { COLORS, timeAgo } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useActivityEvents } from "./useActivityEvents.js";

export default function RecentActivity({ onNavigate, side = "seller" }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  // Orodha kamili inatoka kwenye hook moja inayoshirikiwa na
  // RecentActivityPage.jsx (ukurasa wa "Shughuli Zote") — hapa
  // tunachukua 5 za mwanzo tu kwa ajili ya widget hii.
  const allEvents = useActivityEvents(side, onNavigate);

  const activities = allEvents.slice(0, 5);

  const emptyMessage =
    side === "seller"
      ? t(
          "Hakuna shughuli bado. Anza kwa kuweka mali yako ya kwanza.",
          "No activity yet. Start by posting your first property."
        )
      : t(
          "Hakuna shughuli bado. Anza kwa kuhifadhi mali unayopenda.",
          "No activity yet. Start by saving a property you like."
        );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
      {/* ============================================================ */}
      {/* HEADER — CENTERED */}
      {/* ============================================================ */}
      <div className="flex flex-col items-center gap-1 mb-4 text-center">
        <h2 className="h-card">
          {t("Shughuli za Hivi Karibuni", "Recent Activity")}
        </h2>
        <button
          onClick={() => onNavigate("activity")}
          className="text-body-sm font-semibold hover:underline"
          style={{ color: COLORS.gold }}
        >
          {t("Ona Zote →", "View All →")}
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="text-body-sm text-muted text-center py-6">
          {emptyMessage}
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
                  <p className="text-body-sm text-secondary leading-snug">
                    {a.title}
                  </p>
                  <p className="text-body-sm text-muted mt-0.5">
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
