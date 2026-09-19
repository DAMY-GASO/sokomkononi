// ============================================================
// DealRoomViewer.jsx
// Admin — Anaona kilichojiri kwenye deal room yoyote.
// Bilingual + mobile-responsive.
// ============================================================

import React from "react";
import {
  Shield,
  User,
  Clock,
  MapPin,
  DollarSign,
  FileText,
  Paperclip,
  CheckCircle,
  AlertTriangle,
  HandCoins,
  Calendar,
  CreditCard,
} from "lucide-react";
import { COLORS, formatTZS, timeAgo } from "../../shared/constants.js";

// ============================================================
// RESOLVE SENDER — inabadilisha "me"/"them" kuwa "buyer"/"seller"
// ============================================================
function resolveSender(sender, deal) {
  if (sender === "admin") return "admin";
  if (sender === "buyer" || sender === "seller") return sender;

  const themIsBuyer = deal?.counterpartyName === deal?.buyerName;
  if (sender === "them") return themIsBuyer ? "buyer" : "seller";
  if (sender === "me") return themIsBuyer ? "seller" : "buyer";
  return "buyer";
}

// ============================================================
// HELPER — message text
// ============================================================
function getMessageText(message, lang) {
  if (!message.text) return "";
  if (typeof message.text === "string") return message.text;
  return message.text?.[lang] || message.text?.sw || "";
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
  const tone = isAdmin ? COLORS.rust : isSeller ? COLORS.gold : COLORS.green;

  const text =
    getMessageText(message, lang) ||
    (message.offerAmount
      ? lang === "sw"
        ? `Ofa ya ${formatTZS(message.offerAmount)}`
        : `Offer of ${formatTZS(message.offerAmount)}`
      : "");

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
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: `${tone}20`, color: tone }}
      >
        {isAdmin ? <Shield size={11} /> : initial}
      </div>

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
            <span className="text-[9px] text-muted ml-auto">
              {timeLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-primary leading-snug break-words">
          {text}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// INFO ROW
// ============================================================
function InfoRow({ icon: Icon, label, value, color = COLORS.night }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon size={12} color={color} className="shrink-0 mt-0.5" />
      <span className="text-secondary shrink-0">{label}:</span>
      <span className="text-primary font-medium min-w-0 break-words">
        {value}
      </span>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function DealRoomViewer({ deal, onClose, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  if (!deal) return null;

  const messages = deal.messages || [];
  const messageCount = messages.length;
  const isDisputed = deal.status === "disputed";

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
      className="border-t px-4 sm:px-5 py-4 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">
            {t("Deal Room", "Deal Room")}
          </p>
          <p className="text-xs text-secondary mt-0.5 truncate">
            {deal.listingTitle}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-muted hover:text-secondary text-xs font-semibold shrink-0"
        >
          {t("Funga", "Close")}
        </button>
      </div>

      {/* Dispute Alert */}
      {isDisputed && (
        <div
          style={{
            background: "rgba(193,80,46,0.08)",
            color: COLORS.rust,
            borderColor: "rgba(193,80,46,0.2)",
          }}
          className="flex items-start gap-2 text-xs rounded-lg border px-3 py-2.5"
        >
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            {t(
              "Deal hii ina mgogoro. Admin anaweza kutatua kupitia sehemu ya 'Kagua Mgogoro'.",
              "This deal has a dispute. Admin can resolve it via the 'Review Dispute' section."
            )}
          </span>
        </div>
      )}

      {/* Parties */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="border rounded-lg px-3 py-2.5 flex flex-col gap-1.5"
      >
        <InfoRow
          icon={User}
          label={t("Mnunuzi", "Buyer")}
          value={deal.buyerName || "—"}
          color={COLORS.green}
        />
        <InfoRow
          icon={User}
          label={t("Muuzaji", "Seller")}
          value={deal.sellerName || "—"}
          color={COLORS.gold}
        />
        <InfoRow
          icon={MapPin}
          label={t("Mali", "Listing")}
          value={deal.listingTitle || "—"}
        />
      </div>

      {/* Price Info */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="border rounded-lg px-3 py-2.5 flex flex-col gap-1.5"
      >
        <InfoRow
          icon={DollarSign}
          label={t("Bei ya Awali", "Asking Price")}
          value={formatTZS(deal.askingPrice)}
          color={COLORS.night}
        />
        <InfoRow
          icon={HandCoins}
          label={t("Ofa ya Sasa", "Current Offer")}
          value={formatTZS(deal.currentOffer ?? deal.askingPrice)}
          color={COLORS.rust}
        />
        {deal.reservationFee != null && (
          <>
            <InfoRow
              icon={CreditCard}
              label={t("Reservation Fee", "Reservation Fee")}
              value={formatTZS(deal.reservationFee)}
              color={COLORS.gold}
            />
            <InfoRow
              icon={Clock}
              label={t("Muda wa Reservation", "Reservation Duration")}
              value={
                lang === "sw"
                  ? `Saa ${deal.reservationHours ?? "—"}`
                  : `${deal.reservationHours ?? "—"} hrs`
              }
            />
            <InfoRow
              icon={FileText}
              label={t("Njia ya Malipo", "Payment Method")}
              value={deal.reservationMethod || "—"}
            />
          </>
        )}
        {deal.reservationExpiresAt && (
          <InfoRow
            icon={Calendar}
            label={t("Reservation Inaisha", "Reservation Expires")}
            value={new Date(deal.reservationExpiresAt).toLocaleString(
              lang === "sw" ? "sw-TZ" : "en-US"
            )}
            color={COLORS.rust}
          />
        )}
      </div>

      {/* Payment Proof */}
      {deal.paymentProof && (
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-secondary uppercase mb-1.5">
            {t("Uthibitisho wa Malipo", "Payment Proof")}
          </p>
          <div
            style={{ borderColor: COLORS.sandLine, background: "white" }}
            className="border rounded-lg px-3 py-2.5 flex flex-col gap-1.5"
          >
            <InfoRow
              icon={CreditCard}
              label={t("Njia", "Method")}
              value={deal.paymentProof.method || "—"}
            />
            <InfoRow
              icon={FileText}
              label="Reference"
              value={deal.paymentProof.reference || "—"}
            />
            {deal.paymentProof.submittedAt && (
              <InfoRow
                icon={Clock}
                label={t("Ilitumwa", "Submitted")}
                value={timeAgo(deal.paymentProof.submittedAt, lang)}
              />
            )}
          </div>
        </div>
      )}

      {/* Dispute Reason */}
      {deal.disputeNote && (
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-secondary uppercase mb-1.5">
            {t("Sababu ya Mgogoro", "Dispute Reason")}
          </p>
          <p
            style={{ borderColor: COLORS.sandLine }}
            className="text-sm text-primary bg-white border rounded-lg px-3 py-2.5 break-words"
          >
            {deal.disputeNote}
          </p>
        </div>
      )}

      {/* Message History */}
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-semibold text-secondary uppercase">
            {t("Historia ya Mazungumzo", "Message History")}
          </p>
          {messageCount > 0 && (
            <span className="text-[10px] text-muted">
              {messageCount} {t("ujumbe", "messages")}
            </span>
          )}
        </div>
        <div
          style={{ borderColor: COLORS.sandLine }}
          className="max-h-72 sm:max-h-96 overflow-y-auto flex flex-col gap-2 bg-gray-50/50 border rounded-lg p-2.5 sm:p-3"
        >
          {messageCount === 0 ? (
            <p className="text-xs text-muted text-center py-4">
              {t(
                "Hakuna ujumbe kwenye deal hii.",
                "No messages in this deal."
              )}
            </p>
          ) : (
            messages.map((m) => (
              <MessageBubble key={m.id} message={m} deal={deal} lang={lang} />
            ))
          )}
        </div>
      </div>

      {/* Footer — info */}
      <p className="text-[10px] text-muted text-center">
        {t(
          "Hii ni admin view — read-only. Admin hawezi kutuma ujumbe kama mnunuzi/muuzaji.",
          "This is admin view — read-only. Admin cannot send messages as buyer/seller."
        )}
      </p>
    </div>
  );
}
