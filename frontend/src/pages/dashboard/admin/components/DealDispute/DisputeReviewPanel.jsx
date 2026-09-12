// ============================================================
// DisputeReviewPanel.jsx
// Panel ya kutatua mgogoro — Admin anachagua action.
// Bilingual.
// ============================================================

import React, { useState } from "react";
import {
  RotateCcw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { COLORS, formatTZS } from "../../shared/constants.js";

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

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
      className="border-t px-5 py-4 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">
          {lang === "sw" ? "Kagua Mgogoro" : "Review Dispute"} —{" "}
          {deal.listingTitle}
        </p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
        >
          {lang === "sw" ? "Funga" : "Close"}
        </button>
      </div>

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

      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5">
          {lang === "sw" ? "Historia ya Mazungumzo" : "Message History"}
        </p>
        <div
          style={{ borderColor: COLORS.sandLine }}
          className="max-h-52 overflow-y-auto flex flex-col gap-2 bg-white border rounded-lg p-3"
        >
          {deal.messages.map((m) => {
            const who =
              m.sender === "admin"
                ? "Admin"
                : m.sender === "me"
                  ? lang === "sw"
                    ? "Muuzaji"
                    : "Seller"
                  : lang === "sw"
                    ? "Mnunuzi"
                    : "Buyer";
            const text =
              m.text ||
              (m.offerAmount
                ? lang === "sw"
                  ? `Ofa ya ${formatTZS(m.offerAmount)}`
                  : `Offer of ${formatTZS(m.offerAmount)}`
                : "");
            return (
              <p key={m.id} className="text-xs leading-snug">
                <span
                  style={{
                    color: m.sender === "admin" ? COLORS.rust : COLORS.night,
                  }}
                  className="font-semibold"
                >
                  {who}:{" "}
                </span>
                <span className="text-gray-500">{text}</span>
              </p>
            );
          })}
        </div>
      </div>

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
                className="flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left"
              >
                <Icon size={16} color={a.tone} className="mt-0.5 shrink-0" />
                <div>
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
              className="text-xs font-semibold px-3 py-2 rounded-lg border text-gray-600"
            >
              {lang === "sw" ? "Ghairi" : "Cancel"}
            </button>
            <button
              onClick={submit}
              style={{ background: COLORS.night, color: COLORS.sand }}
              className="flex-1 text-xs font-semibold px-3 py-2.5 rounded-lg"
            >
              {lang === "sw" ? "Thibitisha Uamuzi" : "Confirm Decision"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
