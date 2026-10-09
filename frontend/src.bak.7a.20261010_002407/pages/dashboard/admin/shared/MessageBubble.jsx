// ============================================================
// MessageBubble.jsx — shared admin deal-room bubble.
// ============================================================
import React from "react";
import { Shield } from "lucide-react";
import { COLORS, formatTZS, resolveSender } from "./constants.js";

function getMessageText(message, lang) {
  if (!message.text) return "";
  if (typeof message.text === "string") return message.text;
  return message.text?.[lang] || message.text?.sw || "";
}

export default function MessageBubble({ message, deal, lang }) {
  const resolvedSender = resolveSender(message.sender, deal);
  const isAdmin = resolvedSender === "admin";
  const isSeller = resolvedSender === "seller";
  const isOffer = Boolean(message.offerAmount);

  const who = isAdmin
    ? "Admin"
    : isSeller
      ? lang === "sw" ? "Muuzaji" : "Seller"
      : lang === "sw" ? "Mnunuzi" : "Buyer";

  const initial = who.charAt(0).toUpperCase();
  const tone = isAdmin ? COLORS.rust : isSeller ? COLORS.gold : COLORS.green;

  const text =
    getMessageText(message, lang) ||
    (message.offerAmount
      ? lang === "sw"
        ? `Ofa ya ${formatTZS(message.offerAmount)}`
        : `Offer of ${formatTZS(message.offerAmount)}`
      : "");

  const timeLabel = message.at
    ? new Date(message.at).toLocaleString(
        lang === "sw" ? "sw-TZ" : "en-US",
        { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }
      )
    : null;

  return (
    <div className={`flex gap-2 ${isSeller ? "flex-row-reverse" : ""}`}>
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: `${tone}20`, color: tone }}
      >
        {isAdmin ? <Shield size={11} /> : initial}
      </div>
      <div
        className={`flex-1 min-w-0 max-w-[85%] rounded-lg px-2.5 py-1.5 ${isSeller ? "ml-auto" : ""}`}
        style={{
          background: isAdmin ? `${COLORS.rust}10` : isOffer ? `${COLORS.gold}15` : "white",
          border: `1px solid ${
            isAdmin ? `${COLORS.rust}30` : isOffer ? `${COLORS.gold}40` : COLORS.sandLine
          }`,
        }}
      >
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span style={{ color: tone }} className="text-[10px] font-bold uppercase tracking-wide">
            {who}
          </span>
          {isOffer && (
            <span style={{ color: COLORS.rust }} className="text-[9px] font-bold uppercase">
              • {lang === "sw" ? "Ofa" : "Offer"}
            </span>
          )}
          {timeLabel && <span className="text-[9px] text-muted ml-auto">{timeLabel}</span>}
        </div>
        <p className="text-xs text-primary leading-snug break-words">{text}</p>
      </div>
    </div>
  );
}
