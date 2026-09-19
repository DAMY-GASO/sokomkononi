// ============================================================
// DealsSection.jsx
// Deal Rooms & Dispute Resolution — Admin.
// Bilingual + mobile-responsive.
// Admin anaweza kufungua deal room yoyote na kuona kilichojiri.
// ============================================================

import React, { useState } from "react";
import { MoreVertical, Eye, AlertTriangle } from "lucide-react";
import { COLORS, formatTZS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import DisputeReviewPanel from "../components/DealDispute/DisputeReviewPanel.jsx";
import DealRoomViewer from "../components/DealDispute/DealRoomViewer.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useDeals, resolveDispute } from "../../../../config/dealsStore.js";

export default function DealsSection() {
  const { lang } = useLanguage();
  const deals = useDeals();
  const [expandedId, setExpandedId] = useState(null);
  const [disputeId, setDisputeId] = useState(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleResolve = (id, payload) => {
    resolveDispute(id, payload);
    setDisputeId(null);
    setExpandedId(null);
  };

  // ============================================================
  // ACTION BUTTONS — tofauti kwa disputed na nyingine
  // ============================================================
  const ActionButtons = ({ deal, fullWidth = false }) => {
    const isDisputed = deal.status === "disputed";
    const isRoomOpen = expandedId === deal.id;
    const isDisputeOpen = disputeId === deal.id;

    if (isDisputed) {
      return (
        <div className={`flex gap-2 ${fullWidth ? "w-full" : "justify-end"} flex-wrap`}>
          <button
            onClick={() => {
              setExpandedId(isRoomOpen ? null : deal.id);
              setDisputeId(null);
            }}
            style={{
              borderColor: COLORS.sandLine,
              color: "var(--text-primary)",
            }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            <Eye size={13} />
            {t("Angalia Room", "View Room")}
          </button>
          <button
            onClick={() => {
              setDisputeId(isDisputeOpen ? null : deal.id);
              setExpandedId(null);
            }}
            style={{
              background: COLORS.gold,
              color: COLORS.night,
            }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            <AlertTriangle size={13} />
            {isDisputeOpen
              ? t("Funga", "Close")
              : t("Kagua Mgogoro", "Review Dispute")}
          </button>
        </div>
      );
    }

    // Deals nyingine — "Angalia Room" tu
    return (
      <div className={fullWidth ? "flex justify-end" : "flex justify-end"}>
        <button
          onClick={() => setExpandedId(isRoomOpen ? null : deal.id)}
          style={{
            borderColor: COLORS.sandLine,
            color: "var(--text-primary)",
          }}
          className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors ${
            fullWidth ? "w-full" : ""
          }`}
        >
          <Eye size={13} />
          {isRoomOpen
            ? t("Funga", "Close")
            : t("Angalia Room", "View Room")}
        </button>
      </div>
    );
  };

  return (
    <>
      <SectionHeader
        title={t(
          "Deal Rooms & Utatuzi wa Migogoro",
          "Deal Rooms & Dispute Resolution"
        )}
        subtitle={t(
          "Fuatilia deals na utatue migogoro. Bofya 'Angalia Room' kuona kilichojiri.",
          "Monitor deals and resolve disputes. Click 'View Room' to see what happened."
        )}
      />

      {/* ============================================================
          DESKTOP — TABLE (sm na juu)
          ============================================================ */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Mali", "Listing")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Mnunuzi", "Buyer")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Muuzaji", "Seller")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {t("Kiasi", "Amount")}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  Status
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-secondary uppercase">
                  {t("Kitendo", "Action")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deals.map((d) => {
                const isDisputed = d.status === "disputed";
                const isExpanded = expandedId === d.id;
                const isDisputeOpen = disputeId === d.id;
                return (
                  <React.Fragment key={d.id}>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-primary">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{d.listingTitle}</span>
                          {isDisputed && (
                            <span
                              style={{
                                background: `${COLORS.rust}15`,
                                color: COLORS.rust,
                              }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                            >
                              {t("MGOGORO", "DISPUTE")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary">
                        {d.buyerName}
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary">
                        {d.sellerName}
                      </td>
                      <td
                        className="px-5 py-3 text-sm font-semibold"
                        style={{ color: COLORS.rust }}
                      >
                        {formatTZS(d.currentOffer ?? d.askingPrice)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={d.status} lang={lang} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ActionButtons deal={d} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <DealRoomViewer
                            deal={d}
                            onClose={() => setExpandedId(null)}
                            lang={lang}
                          />
                        </td>
                      </tr>
                    )}
                    {isDisputed && isDisputeOpen && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <DisputeReviewPanel
                            deal={d}
                            onResolve={handleResolve}
                            onClose={() => setDisputeId(null)}
                            lang={lang}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {deals.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-muted"
                  >
                    {t("Hakuna deals", "No deals")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================
          MOBILE — CARD LIST (sm na chini)
          ============================================================ */}
      <div className="sm:hidden flex flex-col gap-3">
        {deals.map((d) => {
          const isDisputed = d.status === "disputed";
          const isExpanded = expandedId === d.id;
          const isDisputeOpen = disputeId === d.id;
          return (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <div className="p-4">
                {/* Title + Status */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary line-clamp-2">
                      {d.listingTitle}
                    </p>
                    {isDisputed && (
                      <span
                        style={{
                          background: `${COLORS.rust}15`,
                          color: COLORS.rust,
                        }}
                        className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                      >
                        {t("MGOGORO", "DISPUTE")}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={d.status} lang={lang} />
                  </div>
                </div>

                {/* Buyer + Seller */}
                <div className="flex flex-col gap-0.5 text-xs text-secondary mb-2">
                  <span className="truncate">
                    {t("Mnunuzi", "Buyer")}:{" "}
                    <span className="font-medium text-primary">
                      {d.buyerName}
                    </span>
                  </span>
                  <span className="truncate">
                    {t("Muuzaji", "Seller")}:{" "}
                    <span className="font-medium text-primary">
                      {d.sellerName}
                    </span>
                  </span>
                </div>

                {/* Amount */}
                <p
                  className="text-sm font-bold mb-3"
                  style={{ color: COLORS.rust }}
                >
                  {formatTZS(d.currentOffer ?? d.askingPrice)}
                </p>

                {/* Action Buttons */}
                <ActionButtons deal={d} fullWidth />
              </div>

              {/* Expanded — Deal Room Viewer */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  <DealRoomViewer
                    deal={d}
                    onClose={() => setExpandedId(null)}
                    lang={lang}
                  />
                </div>
              )}

              {/* Dispute Review Panel */}
              {isDisputed && isDisputeOpen && (
                <div className="border-t border-gray-100">
                  <DisputeReviewPanel
                    deal={d}
                    onResolve={handleResolve}
                    onClose={() => setDisputeId(null)}
                    lang={lang}
                  />
                </div>
              )}
            </div>
          );
        })}

        {deals.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-muted">
            {t("Hakuna deals", "No deals")}
          </div>
        )}
      </div>
    </>
  );
}
