// ============================================================
// DealsSection.jsx
// Deal Rooms & Dispute Resolution — Admin.
// Bilingual.
// ============================================================

import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import { COLORS, formatTZS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import DisputeReviewPanel from "../components/DealDispute/DisputeReviewPanel.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useDeals, resolveDispute } from "../../../../config/dealsStore.js";

export default function DealsSection() {
  const { lang } = useLanguage();
  const deals = useDeals();
  const [expandedId, setExpandedId] = useState(null);

  const handleResolve = (id, payload) => {
    resolveDispute(id, payload);
    setExpandedId(null);
  };

  return (
    <>
      <SectionHeader
        title={
          lang === "sw"
            ? "Deal Rooms & Utatuzi wa Migogoro"
            : "Deal Rooms & Dispute Resolution"
        }
        subtitle={
          lang === "sw"
            ? "Fuatilia deals na utatue migogoro"
            : "Monitor deals and resolve disputes"
        }
      />
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  {lang === "sw" ? "Mali" : "Listing"}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  {lang === "sw" ? "Mnunuzi" : "Buyer"}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  {lang === "sw" ? "Muuzaji" : "Seller"}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  {lang === "sw" ? "Kiasi" : "Amount"}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">
                  {lang === "sw" ? "Kitendo" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deals.map((d) => {
                const isDisputed = d.status === "disputed";
                const isExpanded = expandedId === d.id;
                return (
                  <React.Fragment key={d.id}>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          {d.listingTitle}
                          {isDisputed && (
                            <span
                              style={{
                                background: `${COLORS.rust}15`,
                                color: COLORS.rust,
                              }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            >
                              {lang === "sw" ? "MGOGORO" : "DISPUTE"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {d.buyerName}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
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
                        {isDisputed ? (
                          <button
                            onClick={() =>
                              setExpandedId(isExpanded ? null : d.id)
                            }
                            style={{
                              background: COLORS.gold,
                              color: COLORS.night,
                            }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                          >
                            {isExpanded
                              ? lang === "sw"
                                ? "Funga"
                                : "Close"
                              : lang === "sw"
                                ? "Kagua Mgogoro"
                                : "Review Dispute"}
                          </button>
                        ) : (
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                    {isDisputed && isExpanded && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <DisputeReviewPanel
                            deal={d}
                            onResolve={handleResolve}
                            onClose={() => setExpandedId(null)}
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
                    className="px-5 py-8 text-center text-sm text-gray-400"
                  >
                    {lang === "sw" ? "Hakuna deals" : "No deals"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
