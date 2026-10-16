// ============================================================
// DealRoomViewer.jsx
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
  HandCoins,
  Calendar,
  CreditCard,
  Loader2,
} from "lucide-react";
import { COLORS, formatTZS, timeAgo } from "../../shared/constants.js";
import MessageBubble from "../../shared/MessageBubble.jsx";

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
export default function DealRoomViewer({
  deal,
  roomData,
  loading,
  onClose,
  lang,
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  if (!deal) return null;

  const messages =
    (Array.isArray(roomData?.messages) && roomData.messages.length > 0
      ? roomData.messages
      : deal.messages) || [];
  const messageCount = messages.length;
  const paymentProof = roomData?.paymentProof ?? deal.paymentProof ?? null;

  const currentOffer =
    deal.currentOffer && deal.currentOffer > 0
      ? deal.currentOffer
      : deal.askingPrice || 0;

  const hasReservation =
    (deal.reservationFee ?? 0) > 0 || Boolean(deal.reservationPaidAt);

  if (loading) {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
        className="border-t px-4 sm:px-5 py-8 flex items-center justify-center gap-2"
      >
        <Loader2 size={16} className="animate-spin text-muted" />
        <span className="text-xs text-muted">
          {t("Inapakia deal room...", "Loading deal room...")}
        </span>
      </div>
    );
  }

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
          value={formatTZS(deal.askingPrice || 0)}
          color={COLORS.night}
        />
        <InfoRow
          icon={HandCoins}
          label={t("Ofa ya Sasa", "Current Offer")}
          value={formatTZS(currentOffer)}
          color={COLORS.rust}
        />
        {hasReservation && (
          <>
            <InfoRow
              icon={CreditCard}
              label={t("Reservation Fee", "Reservation Fee")}
              value={formatTZS(deal.reservationFee || 0)}
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
      {paymentProof && (
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
              value={paymentProof.method || "—"}
            />
            <InfoRow
              icon={FileText}
              label="Reference"
              value={paymentProof.reference || "—"}
            />
            {paymentProof.submittedAt && (
              <InfoRow
                icon={Clock}
                label={t("Ilitumwa", "Submitted")}
                value={timeAgo(paymentProof.submittedAt, lang)}
              />
            )}
            {paymentProof.url && (
              <a
                href={paymentProof.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#2F6D4F] hover:underline mt-1"
              >
                <Paperclip size={12} />
                {t("Fungua Picha ya Uthibitisho", "Open Proof Image")}
              </a>
            )}
          </div>
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
            messages.map((m, idx) => (
              <MessageBubble
                key={m.id || `msg-${idx}`}
                message={m}
                deal={deal}
                lang={lang}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-muted text-center">
        {t(
          "Hii ni admin view — read-only. Admin hawezi kutuma ujumbe kama mnunuzi/muuzaji.",
          "This is admin view — read-only. Admin cannot send messages as buyer/seller."
        )}
      </p>
    </div>
  );
}