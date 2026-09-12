// ============================================================
// ModerationSection.jsx
// Uidhinishaji wa mali & matangazo — approve/reject listings.
// Bilingual.
// ============================================================

import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  MoreVertical,
} from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useListings, decideListing } from "../../../../config/listingsStore.js";

export default function ModerationSection() {
  const { lang } = useLanguage();
  const listings = useListings();
  const [statusFilter, setStatusFilter] = useState("in_review");

  const formatTZS = (amount) =>
    "TZS " + Math.round(amount || 0).toLocaleString("en-US");

  const filtered = listings.filter(
    (l) => statusFilter === "zote" || l.status === statusFilter
  );

  const filters = [
    { key: "in_review", label: { sw: "Zinasubiri", en: "Pending" } },
    { key: "live", label: { sw: "Zimeidhinishwa", en: "Approved" } },
    { key: "rejected", label: { sw: "Zimekataliwa", en: "Rejected" } },
    { key: "zote", label: { sw: "Zote", en: "All" } },
  ];

  return (
    <>
      <SectionHeader
        title={
          lang === "sw"
            ? "Uidhinishaji wa Mali & Matangazo"
            : "Listing & Ads Moderation"
        }
        subtitle={
          lang === "sw"
            ? "Idhinisha au kataa mali kabla hazijachapishwa"
            : "Approve or reject listings before they are published"
        }
      />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            style={{
              background: statusFilter === f.key ? COLORS.night : "white",
              color: statusFilter === f.key ? COLORS.sand : COLORS.night,
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full border whitespace-nowrap shrink-0"
          >
            {f.label[lang]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  {lang === "sw" ? "Mali" : "Listing"}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  {lang === "sw" ? "Muuzaji" : "Seller"}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  {lang === "sw" ? "Bei" : "Price"}
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
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">
                    {l.title}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {l.category}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {l.seller || l.seller_name}
                  </td>
                  <td
                    className="px-5 py-3 text-sm font-semibold"
                    style={{ color: COLORS.rust }}
                  >
                    {formatTZS(l.price)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={l.status} lang={lang} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {l.status === "in_review" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => decideListing(l.id, "live")}
                          style={{ color: COLORS.green }}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200"
                        >
                          <CheckCircle size={13} />
                          {lang === "sw" ? "Idhinisha" : "Approve"}
                        </button>
                        <button
                          onClick={() => decideListing(l.id, "rejected")}
                          style={{ color: COLORS.rust }}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200"
                        >
                          <XCircle size={13} />
                          {lang === "sw" ? "Kataa" : "Reject"}
                        </button>
                      </div>
                    ) : (
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-gray-400"
                  >
                    {lang === "sw"
                      ? "Hakuna mali katika kundi hili"
                      : "No listings in this group"}
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
