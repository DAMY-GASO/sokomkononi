// ============================================================
// RecentActivityPage.jsx
// Ukurasa kamili wa "Shughuli Zote" — historia nzima ya matukio
// ya mtumiaji (muuzaji au mnunuzi), bila kikomo cha 5 kama
// RecentActivity.jsx (widget ya dashboard).
//
// Inafikiwa kupitia "Ona Zote →" kwenye RecentActivity.jsx.
//
// MAHALI: weka faili hii kwenye
//   src/pages/dashboard/components/RecentActivityPage.jsx
// ============================================================

import React, { useMemo, useState } from "react";
import { History, Inbox } from "lucide-react";
import { COLORS, timeAgo } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useActivityEvents } from "./useActivityEvents.js";

export default function RecentActivityPage({ side = "seller", onNavigate }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [typeFilter, setTypeFilter] = useState("all");

  const allEvents = useActivityEvents(side, onNavigate);

  const filterTabs = useMemo(() => {
    const base = [{ key: "all", label: t("Zote", "All") }];
    if (side === "seller") {
      base.push(
        { key: "listing", label: t("Mali", "Listings") },
        { key: "deal", label: t("Deals", "Deals") },
        { key: "payment", label: t("Malipo", "Payments") }
      );
    } else {
      base.push(
        { key: "saved", label: t("Zilizohifadhiwa", "Saved") },
        { key: "deal", label: t("Deals", "Deals") },
        { key: "payment", label: t("Malipo", "Payments") }
      );
    }
    return base;
  }, [side, lang]);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return allEvents;
    return allEvents.filter((e) => e.type === typeFilter);
  }, [allEvents, typeFilter]);

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
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* ============================================================ */}
      {/* HEADER — CENTERED */}
      {/* ============================================================ */}
      <div className="mb-6 text-center">
        <h1 className="h-title flex items-center justify-center gap-2">
          <History size={22} color={COLORS.gold} />
          {t("Shughuli Zote", "All Activity")}
        </h1>
        <p className="text-body-sm text-secondary mt-2 max-w-xl mx-auto">
          {t(
            "Historia kamili ya matukio yako yote — mali, deals, na malipo.",
            "The full history of your activity — listings, deals, and payments."
          )}
        </p>
      </div>

      {/* ============================================================ */}
      {/* FILTER TABS */}
      {/* ============================================================ */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {filterTabs.map((f) => {
          const isActive = typeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              style={{
                background: isActive ? COLORS.night : "white",
                color: isActive ? COLORS.sand : "var(--text-primary)",
                borderColor: COLORS.sandLine,
              }}
              className="text-body-sm font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0"
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* LIST */}
      {/* ============================================================ */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-14 text-center">
          <Inbox size={28} className="text-muted mx-auto mb-2" />
          <p className="text-body-sm text-muted">
            {typeFilter === "all"
              ? emptyMessage
              : t("Hakuna shughuli za aina hii.", "No activity of this type.")}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {filtered.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={a.onClick}
                className="w-full flex items-start gap-3 p-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div
                  style={{ background: `${a.color}15` }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                >
                  <Icon size={16} color={a.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-primary font-medium leading-snug">
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
