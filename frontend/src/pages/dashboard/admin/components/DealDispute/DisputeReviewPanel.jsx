// ============================================================
// DisputeReviewPanel.jsx
// Panel ya kutatua mgogoro — Admin anachagua action.
// Bilingual + responsive + message history iliyoboreshwa.
// Ina-support sender: "me" | "them" | "buyer" | "seller" | "admin"
// ============================================================

import React, { useState } from "react";
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  Shield,
} from "lucide-react";
import { COLORS, formatTZS } from "../../shared/constants.js";

// ============================================================
// RESOLVE SENDER — inabadilisha "me"/"them" kuwa "buyer"/"seller"
// ============================================================
function resolveSender(sender, deal) {
  if (sender === "admin") return "admin";
  if (sender === "buyer" || sender === "seller") return sender;

  // "me" na "them" — inategemea counterpartyName
  // Kama counterpartyName === buyerName: "them" = buyer, "me" = seller
  // Kama counterpartyName === sellerName: "them" = seller, "me" = buyer
  const themIsBuyer = deal?.counterpartyName === deal?.buyerName;

  if (sender === "them") return themIsBuyer ? "buyer" : "seller";
  if (sender === "me") return themIsBuyer ? "seller" : "buyer";

  return "buyer"; // fallback
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================
function MessageBubble({ message, deal, lang }) {
  const resolvedSender = resolveSender(message.sender, deal);
  const isAdmin = resolvedSender === "admin";
  const isSeller = resolvedSender === "seller";
  const isOffer = Boolean(message.offerAmount);

  const who = isAdmin
    ? "Admin"
    : isSeller
      ? lang === "sw"
        ? "Muuzaji"
        : "Seller"
      : lang === "sw"
        ? "Mnunuzi"
        : "Buyer";

  const initial = who.charAt(0).toUpperCase();

  // Rangi
  const tone = isAdmin ? COLORS.rust : isSeller ? COLORS.gold : COLORS.green;

  // Text
  const text =
    message.text ||
    (message.offerAmount
      ? lang === "sw"
        ? `Ofa ya ${formatTZS(message.offerAmount)}`
        : `Offer of ${formatTZS(message.offerAmount)}`
      : "");

  // Timestamp
  const timeLabel = message.at
    ? new Date(message.at).toLocaleString(lang === "sw" ? "sw-TZ" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      })
    : null;

  return (
    <div className={`flex gap-2 ${isSeller ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: `${tone}20`, color: tone }}
      >
        {isAdmin ? <Shield size={11} /> : initial}
      </div>

      {/* Bubble */}
      <div
        className={`flex-1 min-w-0 max-w-[85%] rounded-lg px-2.5 py-1.5 ${
          isSeller ? "ml-auto" : ""
        }`}
        style={{
          background: isAdmin
            ? `${COLORS.rust}10`
            : isOffer
              ? `${COLORS.gold}15`
              : "white",
          border: `1px solid ${
            isAdmin
              ? `${COLORS.rust}30`
              : isOffer
                ? `${COLORS.gold}40`
                : COLORS.sandLine
          }`,
        }}
      >
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span
            style={{ color: tone }}
            className="text-[10px] font-bold uppercase tracking-wide"
          >
            {who}
          </span>
          {isOffer && (
            <span
              style={{ color: COLORS.rust }}
              className="text-[9px] font-bold uppercase"
            >
              • {lang === "sw" ? "Ofa" : "Offer"}
            </span>
          )}
          {timeLabel && (
            <span className="text-[9px] text-gray-400 ml-auto">
              {timeLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-700 leading-snug break-words">
          {text}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// DISPUTE REVIEW PANEL
// ============================================================
export default function DisputeReviewPanel({ deal, onResolve, onClose, lang }) {
  const [action, setAction] = useState(null);
  const [note, setNote] = useState("");

  const disputeActions = [
    {
      key: "refund",
      label: {
        sw: "Rudisha Fedha kwa Mnunuzi",
        en: "Refund Buyer",
      },
      desc: {
        sw: "Malalamiko ni sahihi — deal inaghairiwa na mnunuzi anarejeshewa fedha alizolipa.",
        en: "Complaint is valid — deal is cancelled and the buyer is refunded.",
      },
      icon: RotateCcw,
      tone: COLORS.green,
    },
    {
      key: "continue",
      label: {
        sw: "Endelea na Deal",
        en: "Continue with Deal",
      },
      desc: {
        sw: "Baada ya kukagua, hakuna tatizo la kutosha kusimamisha deal — inarudi kwenye majadiliano.",
        en: "After review, no sufficient issue to stop the deal — it returns to negotiation.",
      },
      icon: CheckCircle,
      tone: COLORS.gold,
    },
    {
      key: "cancel",
      label: {
        sw: "Ghairi Kabisa (Bila Kurejesha)",
        en: "Cancel Completely (No Refund)",
      },
      desc: {
        sw: "Deal inasitishwa kabisa. Hakuna urejeshaji wa fedha kwa upande wowote.",
        en: "Deal is completely stopped. No refund to either party.",
      },
      icon: XCircle,
      tone: COLORS.rust,
    },
  ];

  const submit = () => {
    if (!action) return;
    onResolve(deal.id, { action, adminNote: note.trim() });
    setAction(null);
    setNote("");
  };

  const messages = deal.messages || [];
  const messageCount = messages.length;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
      className="border-t px-4 sm:px-5 py-4 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800">
            {lang === "sw" ? "Kagua Mgogoro" : "Review Dispute"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {deal.listingTitle}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xs font-semibold shrink-0"
        >
          {lang === "sw" ? "Funga" : "Close"}
        </button>
      </div>

      {/* Parties */}
      <div
        style={{ borderColor: COLORS.sandLine }}
        className="flex flex-wrap gap-x-4 gap-y-1 bg-white border rounded-lg px-3 py-2 text-xs"
      >
        <span className="text-gray-500">
          {lang === "sw" ? "Mnunuzi:" : "Buyer:"}{" "}
          <span className="font-semibold text-gray-700">{deal.buyerName}</span>
        </span>
        <span className="text-gray-500">
          {lang === "sw" ? "Muuzaji:" : "Seller:"}{" "}
          <span className="font-semibold text-gray-700">{deal.sellerName}</span>
        </span>
      </div>

      {/* Buyer's reason */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5">
          {lang === "sw" ? "Sababu ya Mnunuzi" : "Buyer's Reason"}
        </p>
        <p
          style={{ borderColor: COLORS.sandLine }}
          className="text-sm text-gray-700 bg-white border rounded-lg px-3 py-2.5"
        >
          {deal.disputeNote ||
            (lang === "sw"
              ? "Hakuna maelezo yaliyotolewa na mnunuzi."
              : "No description provided by the buyer.")}
        </p>
      </div>

      {/* Reservation fee */}
      {deal.reservationFee != null && (
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5">
            Reservation Fee
          </p>
          <div
            style={{ borderColor: COLORS.sandLine }}
            className="flex flex-wrap gap-x-5 gap-y-1 bg-white border rounded-lg px-3 py-2.5 text-xs text-gray-600"
          >
            <span>
              {lang === "sw" ? "Muda" : "Duration"}:{" "}
              {lang === "sw"
                ? `Saa ${deal.reservationHours ?? "—"}`
                : `${deal.reservationHours ?? "—"} hrs`}
            </span>
            <span>
              {lang === "sw" ? "Kiasi" : "Amount"}:{" "}
              {formatTZS(deal.reservationFee)}
            </span>
            <span>
              {lang === "sw" ? "Njia" : "Method"}:{" "}
              {deal.reservationMethod || "—"}
            </span>
          </div>
        </div>
      )}

      {/* Message history */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-semibold text-gray-500 uppercase">
            {lang === "sw" ? "Historia ya Mazungumzo" : "Message History"}
          </p>
          {messageCount > 0 && (
            <span className="text-[10px] text-gray-400">
              {messageCount} {lang === "sw" ? "ujumbe" : "messages"}
            </span>
          )}
        </div>
        <div
          style={{ borderColor: COLORS.sandLine }}
          className="max-h-64 sm:max-h-80 overflow-y-auto flex flex-col gap-2 bg-gray-50/50 border rounded-lg p-2.5 sm:p-3"
        >
          {messageCount === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              {lang === "sw"
                ? "Hakuna ujumbe kwenye deal hii."
                : "No messages in this deal."}
            </p>
          ) : (
            messages.map((m) => (
              <MessageBubble key={m.id} message={m} deal={deal} lang={lang} />
            ))
          )}
        </div>
      </div>

      {/* Decision */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase mb-2">
          {lang === "sw" ? "Chagua Uamuzi" : "Choose Decision"}
        </p>
        <div className="flex flex-col gap-2">
          {disputeActions.map((a) => {
            const Icon = a.icon;
            const isActive = action === a.key;
            return (
              <button
                key={a.key}
                onClick={() => setAction(a.key)}
                style={{
                  borderColor: isActive ? a.tone : COLORS.sandLine,
                  background: isActive ? `${a.tone}12` : "white",
                }}
                className="flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors"
              >
                <Icon size={16} color={a.tone} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p style={{ color: a.tone }} className="text-xs font-semibold">
                    {a.label[lang]}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {a.desc[lang]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Note + Confirm */}
      {action && (
        <div className="flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              lang === "sw" ? "Maelezo ya uamuzi..." : "Decision note..."
            }
            rows={2}
            style={{ borderColor: COLORS.sandLine }}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none bg-white"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAction(null);
                setNote("");
              }}
              style={{ borderColor: COLORS.sandLine }}
              className="text-xs font-semibold px-3 py-2 rounded-lg border text-gray-600 hover:bg-white transition-colors"
            >
              {lang === "sw" ? "Ghairi" : "Cancel"}
            </button>
            <button
              onClick={submit}
              style={{ background: COLORS.night, color: COLORS.sand }}
              className="flex-1 text-xs font-semibold px-3 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              {lang === "sw" ? "Thibitisha Uamuzi" : "Confirm Decision"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
