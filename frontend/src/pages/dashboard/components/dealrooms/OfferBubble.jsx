import React from "react";
import { COLORS, formatTZS } from "../shared";
import { HandCoins } from "lucide-react";

// ============================================================
// OFFER BUBBLE
// ============================================================
export default function OfferBubble({ amount, mine, lang }) {
  return (
    <div
      style={{
        background: mine ? COLORS.gold : "white",
        borderColor: COLORS.sandLine,
      }}
      className="border rounded-2xl px-4 py-3 max-w-full flex items-center gap-2"
    >
      <HandCoins size={16} color={mine ? COLORS.night : COLORS.rust} />
      <div>
        <p
          style={{ color: mine ? COLORS.night : "rgba(16,26,46,0.55)" }}
          className="text-body-sm"
        >
          {lang === "sw" ? "Ofa" : "Offer"}
        </p>
        <p
          style={{ color: mine ? COLORS.night : COLORS.rust }}
          className="text-sm font-bold"
        >
          {formatTZS(amount)}
        </p>
      </div>
    </div>
  );
}
