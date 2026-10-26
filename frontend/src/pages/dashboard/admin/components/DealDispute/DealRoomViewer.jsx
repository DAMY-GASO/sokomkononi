// ============================================================
// DealRoomViewer.jsx
// ============================================================

import React, { useState } from "react";
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
  Download,
  Flag,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { COLORS, formatTZS, timeAgo } from "../../shared/constants.js";
import MessageBubble from "../../shared/MessageBubble.jsx";
import { getDealTranscript } from "../../../../../config/dealsStore.js";
import { exportTranscript } from "../../../../../utils/exportDealTranscript.js";

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
// DOWNLOAD BAR
// ============================================================
function DownloadBar({ dealId, deal, lang }) {
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleDownload = async (format) => {
    if (!dealId) return;
    setError("");
    setDownloading(format);

    try {
      // Chukua deal kutoka store au prop
      const source = getDealTranscript(dealId, null, lang)?.deal || deal;
      if (!source) {
        throw new Error(t("Deal haipatikani.", "Deal not found."));
      }

      // ✅ Function ya kutambua mtumaji (buyer/seller/admin) kwa majina
      const getSenderLabel = (m) => {
        if (m.senderId != null) {
          if (String(m.senderId) === String(source.buyerId)) {
            return source.buyerName || t("Mnunuzi", "Buyer");
          }
          if (String(m.senderId) === String(source.sellerId)) {
            return source.sellerName || t("Muuzaji", "Seller");
          }
        }
        // Kama senderId haipo, tumia m.sender (kama ilivyo)
        if (m.sender === "buyer") return source.buyerName || t("Mnunuzi", "Buyer");
        if (m.sender === "seller") return source.sellerName || t("Muuzaji", "Seller");
        return t("Admin", "Admin");
      };

      // ✅ Tengeneza transcript na majina ya wazungumzaji
      const transcript = {
        deal: source,
        meta: {
          dealRoomId: source.id,
          listingTitle: source.listingTitle,
          location: source.location,
          category: source.category,
          buyerName: source.buyerName,
          buyerId: source.buyerId,
          sellerName: source.sellerName,
          sellerId: source.sellerId,
          status: source.status,
          askingPrice: source.askingPrice,
          currentOffer: source.currentOffer,
          agreedPrice: source.agreedPrice,
          agreedAt: source.agreedAt || null,
          reservationFee: source.reservationFee || 0,
          reservationHours: source.reservationHours || null,
          reservationMethod: source.reservationMethod || "",
          reservationExpiresAt: source.reservationExpiresAt || null,
          createdAt: source.createdAt,
          updatedAt: source.updatedAt,
          exportedAt: new Date().toISOString(),
          exportedBy: "admin",
          labels: {
            title: t("Ripoti ya Mazungumzo — Deal Room", "Deal Room Transcript"),
            dealInfo: t("Taarifa za Deal", "Deal Info"),
            participants: t("Washiriki", "Participants"),
            listing: t("Mali", "Listing"),
            timeline: t("Muda", "Timeline"),
            conversation: t("Mazungumzo", "Conversation"),
            offer: t("Ofa", "Offer"),
            message: t("Ujumbe", "Message"),
            from: t("Kutoka", "From"),
            to: t("Kwa", "To"),
            date: t("Tarehe", "Date"),
            you: t("Wewe", "You"),
            other: t("Mwingine", "Other"),
            admin: t("Admin", "Admin"),
          },
        },
        messages: (source.messages || []).map((m) => ({
          ...m,
          sender: getSenderLabel(m), // ✅ Tumia jina halisi
        })),
      };

      await exportTranscript(transcript, format);
      setDownloading(null);
    } catch (err) {
      console.error("[DealRoomViewer] download failed:", err);
      setError(err?.message || t("Imeshindwa kupakua.", "Failed to download."));
      setDownloading(null);
    }
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="border rounded-lg px-3 py-2.5"
    >
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Download size={12} color={COLORS.night} />
          <p className="text-[11px] font-semibold text-secondary uppercase">
            {t("Pakua Mazungumzo", "Download Transcript")}
          </p>
        </div>
        <p className="text-[10px] text-muted">
          {t("Admin view", "Admin view")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {["TXT", "PDF", "CSV"].map((fmt) => (
          <button
            key={fmt}
            onClick={() => handleDownload(fmt)}
            disabled={!!downloading}
            style={{
              borderColor: COLORS.sandLine,
              color: COLORS.night,
            }}
            className="text-xs font-semibold px-2 py-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {downloading === fmt ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Download size={12} />
            )}
            {fmt}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-[11px] mt-2" style={{ color: COLORS.rust }}>
          {error}
        </p>
      )}
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

  const reports = Array.isArray(deal.reports) ? deal.reports : [];
  const hasReports = reports.length > 0;

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

      {/* Reports */}
      {hasReports && (
        <div
          style={{
            borderColor: "rgba(193,80,46,0.3)",
            background: "rgba(193,80,46,0.06)",
          }}
          className="border rounded-lg px-3 py-2.5"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Flag size={12} color={COLORS.rust} />
            <p
              className="text-[11px] font-semibold uppercase"
              style={{ color: COLORS.rust }}
            >
              {t("Ripoti Zilizowasilishwa", "Submitted Reports")} (
              {reports.length})
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {reports.map((r) => (
              <div
                key={r.id}
                className="text-[11px] text-secondary flex items-start gap-2"
              >
                <AlertTriangle
                  size={11}
                  color={COLORS.rust}
                  className="shrink-0 mt-0.5"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-primary">
                    {r.reporter_role === "buyer"
                      ? t("Mnunuzi", "Buyer")
                      : t("Muuzaji", "Seller")}
                    {" → "}
                    {r.reported_user_name || "—"}
                  </p>
                  <p className="text-muted">
                    {r.report_reason} · {r.code}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parties — ✅ Ongeza majina ya Buyer na Seller */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="border rounded-lg px-3 py-2.5 flex flex-col gap-1.5"
      >
        <InfoRow
          icon={User}
          label={t("Mnunuzi", "Buyer")}
          value={`${deal.buyerName || "—"} (ID: ${deal.buyerId || "—"})`}
          color={COLORS.green}
        />
        <InfoRow
          icon={User}
          label={t("Muuzaji", "Seller")}
          value={`${deal.sellerName || "—"} (ID: ${deal.sellerId || "—"})`}
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
              lang === "sw" ? "sw-TZ" : "en-US",
              { timeZone: "Africa/Dar_es_Salaam" } // ✅ Timezone fix
            )}
            color={COLORS.rust}
          />
        )}
      </div>

      {/* Download */}
      <DownloadBar dealId={deal.id} deal={deal} lang={lang} />

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
          "Hii ni admin view — read-only. Admin hawezi kutuma ujumbe kama mnunuzi/muuzaji, lakini anaweza kupakua transcript.",
          "This is admin view — read-only. Admin cannot send messages as buyer/seller, but can download the transcript."
        )}
      </p>
    </div>
  );
}
