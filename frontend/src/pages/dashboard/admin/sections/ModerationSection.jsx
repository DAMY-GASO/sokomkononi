// ============================================================
// ModerationSection.jsx
// Uidhinishaji wa mali & matangazo — approve/reject listings.
// Bilingual + mobile-responsive (filters centered).
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

  // ============================================================
  // ACTION BUTTONS — inatumika table na card
  // ============================================================
  const ActionButtons = ({ listing, fullWidth = false }) => {
    if (listing.status === "in_review") {
      return (
        <div className={`flex gap-2 ${fullWidth ? "w-full" : "justify-end"}`}>
          <button
            onClick={() => decideListing(listing.id, "live")}
            style={{ color: COLORS.green }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-green-50 transition-colors ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            <CheckCircle size={13} />
            {lang === "sw" ? "Idhinisha" : "Approve"}
          </button>
          <button
            onClick={() => decideListing(listing.id, "rejected")}
            style={{ color: COLORS.rust }}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 transition-colors ${
              fullWidth ? "flex-1" : ""
            }`}
          >
            <XCircle size={13} />
            {lang === "sw" ? "Kataa" : "Reject"}
          </button>
        </div>
      );
    }
    return (
      <div className={fullWidth ? "flex justify-end" : "flex justify-end"}>
        <button className="text-muted hover:text-secondary p-1">
          <MoreVertical size={16} />
        </button>
      </div>
    );
  };

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

      {/* FILTERS — centered */}
      <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2 w-full">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            style={{
              background: statusFilter === f.key ? COLORS.night : "white",
              color: statusFilter === f.key ? COLORS.sand : "var(--text-primary)",
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full border whitespace-nowrap shrink-0"
          >
            {f.label[lang]}
          </button>
        ))}
      </div>

      {/* ============================================================
          DESKTOP — TABLE (sm na juu)
          ============================================================ */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {lang === "sw" ? "Mali" : "Listing"}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  Category
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {lang === "sw" ? "Muuzaji" : "Seller"}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  {lang === "sw" ? "Bei" : "Price"}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-secondary uppercase">
                  Status
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-secondary uppercase">
                  {lang === "sw" ? "Kitendo" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-primary">
                    {l.title}
                  </td>
                  <td className="px-5 py-3 text-sm text-secondary">
                    {l.category}
                  </td>
                  <td className="px-5 py-3 text-sm text-secondary">
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
                    <ActionButtons listing={l} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-muted"
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

      {/* ============================================================
          MOBILE — CARD LIST (sm na chini)
          ============================================================ */}
      <div className="sm:hidden flex flex-col gap-3">
        {filtered.map((l) => (
          <div
            key={l.id}
            className="bg-white rounded-xl border border-gray-100 p-4"
          >
            {/* Header: title + status */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary line-clamp-2">
                  {l.title}
                </p>
                <p className="text-xs text-secondary mt-0.5 truncate">
                  {l.category}
                </p>
              </div>
              <StatusBadge status={l.status} lang={lang} />
            </div>

            {/* Meta: seller + price */}
            <div className="flex items-center justify-between gap-3 mb-3 text-xs">
              <span className="text-secondary truncate min-w-0">
                {lang === "sw" ? "Muuzaji:" : "Seller:"}{" "}
                <span className="font-medium text-primary">
                  {l.seller || l.seller_name}
                </span>
              </span>
              <span
                className="font-semibold shrink-0"
                style={{ color: COLORS.rust }}
              >
                {formatTZS(l.price)}
              </span>
            </div>

            {/* Actions */}
            <ActionButtons listing={l} fullWidth />
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-muted">
            {lang === "sw"
              ? "Hakuna mali katika kundi hili"
              : "No listings in this group"}
          </div>
        )}
      </div>
    </>
  );
}
