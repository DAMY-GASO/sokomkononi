// ============================================================
// LeadsSection.jsx
// Seller anaona leads zote (maulizio ya wanunuzi) kwa listings zake.
// Bilingual + mobile-responsive.
// ============================================================

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Inbox,
  MessageSquare,
  Check,
  Trash2,
  User,
  ExternalLink,
} from "lucide-react";
import { COLORS, FONTS, timeAgo } from "../components/shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useLeads, markLeadResponded, removeLead } from "../../../config/leadsStore.js";

export default function LeadsSection({ onNavigate }) {
  const { lang } = useLanguage();
  const leads = useLeads();
  const [filter, setFilter] = useState("all");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const counts = useMemo(() => {
    return {
      all: leads.length,
      new: leads.filter((l) => l.status === "new").length,
      responded: leads.filter((l) => l.status === "responded").length,
      converted: leads.filter((l) => l.status === "converted").length,
    };
  }, [leads]);

  const filtered = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

  const TABS = [
    { key: "all", label: t("Zote", "All"), count: counts.all },
    { key: "new", label: t("Mpya", "New"), count: counts.new },
    { key: "responded", label: t("Zilizojibiwa", "Responded"), count: counts.responded },
    { key: "converted", label: t("Ziligeuka Deal", "Converted"), count: counts.converted },
  ];

  const getStatusBadge = (status) => {
    const config = {
      new: {
        label: t("Mpya", "New"),
        bg: "rgba(193,80,46,0.12)",
        fg: COLORS.rust,
      },
      responded: {
        label: t("Imejibiwa", "Responded"),
        bg: "rgba(37,99,235,0.12)",
        fg: "#2563EB",
      },
      converted: {
        label: t("Imegeuka Deal", "Converted"),
        bg: "rgba(47,109,79,0.12)",
        fg: COLORS.green,
      },
      ignored: {
        label: t("Imepuuzwa", "Ignored"),
        bg: "rgba(16,26,46,0.08)",
        fg: COLORS.night,
      },
    };
    return config[status] || config.new;
  };

  return (
    <div
      style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "100%" }}
      className="w-full p-4 sm:p-6"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1
            style={{ fontFamily: FONTS.display, color: COLORS.night }}
            className="text-2xl sm:text-3xl font-semibold"
          >
            {t("Maulizio (Leads)", "Enquiries (Leads)")}
          </h1>
          <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mt-1">
            {t(
              "Wanunuzi wanaoulizia mali zako — jibu haraka ili usikose fursa.",
              "Buyers enquiring about your listings — respond quickly to not miss opportunities."
            )}
          </p>
        </div>

        {/* Tabs */}
        {leads.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {TABS.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    background: active ? COLORS.night : "white",
                    color: active ? COLORS.sand : COLORS.night,
                    borderColor: COLORS.sandLine,
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border whitespace-nowrap shrink-0"
                >
                  {tab.label}
                  <span
                    style={{
                      background: active ? "rgba(245,243,236,0.18)" : COLORS.sandLine,
                      color: active ? COLORS.sand : COLORS.night,
                    }}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <div
            style={{ borderColor: COLORS.sandLine }}
            className="rounded-2xl border-2 border-dashed p-10 text-center bg-white"
          >
            <Inbox size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 style={{ color: COLORS.night }} className="font-semibold mb-1">
              {filter === "new"
                ? t("Hakuna leads mpya", "No new leads")
                : t("Hakuna leads", "No leads")}
            </h3>
            <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-sm">
              {t(
                "Wanunuzi wakianza kuulizia mali zako, wataonekana hapa.",
                "When buyers start enquiring about your listings, they'll appear here."
              )}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((lead) => {
              const status = getStatusBadge(lead.status);
              return (
                <div
                  key={lead.id}
                  style={{ borderColor: COLORS.sandLine, background: "white" }}
                  className="rounded-xl border p-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          style={{ background: status.bg, color: status.fg }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        >
                          {status.label}
                        </span>
                        {lead.source === "deal" && (
                          <span
                            style={{
                              background: "rgba(47,109,79,0.12)",
                              color: COLORS.green,
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          >
                            {t("Kutoka Deal Room", "From Deal Room")}
                          </span>
                        )}
                      </div>
                      <p
                        style={{ color: COLORS.night }}
                        className="text-sm font-semibold truncate"
                      >
                        {lead.listingTitle}
                      </p>
                    </div>
                  </div>

                  {/* Buyer info */}
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    <User size={12} />
                    <span className="font-medium text-gray-700">{lead.buyerName}</span>
                    <span className="text-gray-300">•</span>
                    <span>{timeAgo(lead.lastMessageAt, lang)}</span>
                  </div>

                  {/* Message */}
                  <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">
                    {lead.message}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/mali/${lead.listingId}`}
                      style={{
                        borderColor: COLORS.sandLine,
                        color: COLORS.night,
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink size={12} />
                      {t("Angalia Mali", "View Listing")}
                    </Link>

                    {lead.status === "new" && (
                      <button
                        onClick={() => markLeadResponded(lead.id)}
                        style={{ background: COLORS.green, color: "white" }}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Check size={12} />
                        {t("Nimejibu", "Mark Responded")}
                      </button>
                    )}

                    {onNavigate && (
                      <button
                        onClick={() => onNavigate("messages")}
                        style={{
                          borderColor: COLORS.sandLine,
                          color: COLORS.night,
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <MessageSquare size={12} />
                        {t("Nenda Messages", "Go to Messages")}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            t("Ondoa lead hii?", "Remove this lead?")
                          )
                        ) {
                          removeLead(lead.id);
                        }
                      }}
                      className="ml-auto flex items-center gap-1 text-xs font-semibold px-2 py-2 rounded-lg text-gray-400 hover:text-[#C1502E] transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
