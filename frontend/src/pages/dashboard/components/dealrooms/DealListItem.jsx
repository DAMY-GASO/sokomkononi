import React from "react";
import { COLORS, getCategory, timeAgo } from "../shared";
import { FALLBACK_DEAL_STATUS, getDealStatus } from "./dealStatus.js";
import { Lock } from "lucide-react";
import { getCategoryIcon } from "../../../../config/categoriesStore.js";

// ============================================================
// DEAL LIST ITEM
// ============================================================
export default function DealListItem({ deal, active, onSelect, lang }) {
  const category = getCategory(deal.category);
  const Icon = getCategoryIcon(category?.iconKey);
  const status =
    getDealStatus(lang)[deal.status] ||
    FALLBACK_DEAL_STATUS(lang, deal.status);
  const lastMessage = deal.messages[deal.messages.length - 1];

  return (
    <button
      onClick={() => onSelect(deal.id)}
      style={{
        background: active ? "white" : "transparent",
        borderColor: COLORS.sandLine,
      }}
      className="w-full shrink-0 flex items-start gap-3 p-3 rounded-xl border text-left"
    >
      <div
        style={{ background: COLORS.night }}
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
      >
        {Icon && <Icon size={16} color={COLORS.gold} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-primary text-sm font-semibold truncate">
            {deal.counterpartyName}
          </p>
          <span className="text-muted text-body-sm shrink-0">
            {lastMessage ? timeAgo(lastMessage.at, lang) : ""}
          </span>
        </div>
        <p className="text-secondary text-body-sm truncate mb-1.5">
          {deal.listingTitle}
        </p>
        <span
          style={{
            background: status?.bg || "#F5F3EC",
            color: status?.fg || "#101A2E",
          }}
          className="inline-block text-body-sm font-semibold px-2 py-0.5 rounded-full"
        >
          {status?.label || deal.status || "—"}
        </span>
        {deal.paymentState?.awaitingMe && (
          <span
            className="inline-block ml-1 text-body-sm font-semibold px-2 py-0.5 rounded-full"
            style={{ background: COLORS.green, color: "white" }}
          >
            {lang === "sw" ? "Zamu yako" : "Your turn"}
          </span>
        )}
        {deal.adminLocked && deal.status !== "cancelled" && (
          <span
            className="inline-block ml-1 text-body-sm font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(232,163,61,0.2)", color: "#8A5A16" }}
          >
            <Lock size={10} className="inline mr-0.5" />
            {lang === "sw" ? "Imesimamishwa" : "Locked"}
          </span>
        )}
      </div>
    </button>
  );
}
