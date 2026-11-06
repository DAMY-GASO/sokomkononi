// ============================================================
// DealRoomViewer.jsx
// ============================================================

import React, { useState, useEffect } from "react";
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
  Lock,
  Unlock,
  Ban,
  Send,
  X,
  Gavel,
  Timer,
} from "lucide-react";
import { COLORS, formatTZS, timeAgo } from "../../shared/constants.js";
import MessageBubble from "../../shared/MessageBubble.jsx";
import {
  getDealTranscript,
  adminSendMessageAsync,
  adminLockDealAsync,
  adminUnlockDealAsync,
  adminCancelDealAsync,
} from "../../../../../config/dealsStore.js";
import { exportTranscript } from "../../../../../utils/exportDealTranscript.js";

// ============================================================
// HELPERS
// ============================================================
/** Soma ujumbe wa kosa kutoka DRF (detail / non_field_errors / field errors). */
function apiErrorText(err, fallback) {
  const d = err?.data;
  const first = (v) => (Array.isArray(v) ? v[0] : v);
  const candidate =
    first(d?.detail) ||
    first(d?.non_field_errors) ||
    first(d?.text) ||
    first(d?.reason) ||
    err?.message;
  return typeof candidate === "string" && candidate ? candidate : fallback;
}

const _msgTime = (m) => {
  const v = m?.at || m?.created_at;
  const n = v ? new Date(v).getTime() : NaN;
  return Number.isNaN(n) ? null : n;
};

/**
 * Unganisha messages za `roomData` (zilizopakiwa mwanzo) na za `deal`
 * (store — zinasasishwa admin akituma ujumbe/akighairi) kwa `id`,
 * ili ujumbe mpya uonekane bila kusubiri refetch.
 */
function mergeMessages(primary, secondary) {
  const seen = new Set();
  const out = [];
  [...primary, ...secondary].forEach((m, i) => {
    const key = m?.id != null ? `id:${m.id}` : `idx:${i}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(m);
  });
  if (out.every((m) => _msgTime(m) != null)) {
    return [...out].sort((a, b) => _msgTime(a) - _msgTime(b));
  }
  return out;
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
// DOWNLOAD BAR
// ============================================================
function DownloadBar({ dealId, deal, messages, lang }) {
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleDownload = async (format) => {
    if (!dealId) return;
    setError("");
    setDownloading(format);

    try {
      const source = getDealTranscript(dealId, null, lang)?.deal || deal;
      if (!source) {
        throw new Error(t("Deal haipatikani.", "Deal not found."));
      }

      const getSenderLabel = (m) => {
        if (m.kind === "ADMIN" || m.sender === "admin") {
          return "Admin";
        }
        if (m.senderId != null) {
          if (String(m.senderId) === String(source.buyerId)) {
            return source.buyerName || t("Mnunuzi", "Buyer");
          }
          if (String(m.senderId) === String(source.sellerId)) {
            return source.sellerName || t("Muuzaji", "Seller");
          }
        }
        if (m.sender === "buyer") return source.buyerName || t("Mnunuzi", "Buyer");
        if (m.sender === "seller") return source.sellerName || t("Muuzaji", "Seller");
        // Usiite ujumbe usiojulikana "Admin" — transcript ni rekodi rasmi.
        return m.senderName || t("Mfumo", "System");
      };

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
            admin: "Admin",
          },
        },
        messages: (messages || source.messages || []).map((m) => ({
          ...m,
          sender: getSenderLabel(m),
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
          Admin view
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
// MODAL — sababu ya lock/unlock/cancel
// ============================================================
function ReasonModal({
  open,
  title,
  description,
  confirmLabel,
  confirmColor = COLORS.rust,
  requireReason = true,
  placeholder,
  busy = false,
  error = "",
  lang = "sw",
  onClose,
  onConfirm,
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const t = (sw, en) => (lang === "sw" ? sw : en);
  if (!open) return null;

  const canSubmit = !busy && (!requireReason || reason.trim().length > 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60">
      <div
        style={{ background: "white", borderColor: COLORS.sandLine }}
        className="rounded-2xl border w-full max-w-md p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-primary text-base font-bold">{title}</h3>
          <button
            onClick={onClose}
            disabled={busy}
            className="text-muted hover:text-secondary p-1 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>
        {description && (
          <p className="text-xs text-secondary mb-3">{description}</p>
        )}
        {requireReason && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={placeholder || t("Eleza sababu...", "Explain the reason...")}
            style={{
              background: COLORS.sand,
              borderColor: COLORS.sandLine,
              color: COLORS.night,
            }}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none mb-3"
          />
        )}
        {error && (
          <p className="text-xs mb-2" style={{ color: COLORS.rust }}>
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            style={{ borderColor: COLORS.sandLine }}
            className="flex-1 border text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
          >
            {t("Ghairi", "Cancel")}
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={!canSubmit}
            style={{
              background: canSubmit ? confirmColor : COLORS.sandLine,
              color: "white",
            }}
            className="flex-1 text-sm font-semibold px-3 py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                {t("Inatuma...", "Sending...")}
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN ACTIONS PANEL
// ============================================================
function AdminActionsPanel({ deal, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const dealId = deal?.dealRoomId || deal?.id;
  const statusKey = String(deal?.status || "").toLowerCase();
  const isCancelled = statusKey === "cancelled";
  // Deal iliyokamilika/kukataliwa/kughairiwa haihitaji lock wala cancel
  const isFinal = ["completed", "declined", "cancelled"].includes(statusKey);
  // Room iliyoghairiwa haionyeshwi kama "imesimamishwa" hata kama flag imebaki
  const isLocked = !!deal?.adminLocked && !isCancelled;
  const isCancelledByAdmin = !!deal?.cancelledByAdmin;
  const canLock = !isLocked && !isFinal;
  const canUnlock = isLocked && !isCancelled;
  const canCancel = !isFinal;
  const txnId = deal?.transactionId;

  // ── Message state ──
  const [message, setMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgError, setMsgError] = useState("");

  // ── Action modals ──
  const [lockOpen, setLockOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleSendMessage = async () => {
    const text = message.trim();
    if (!text || sendingMsg) return; // zuia double-submit (duplicates)
    setSendingMsg(true);
    setMsgError("");
    try {
      const res = await adminSendMessageAsync(dealId, text);
      if (res.ok) {
        setMessage("");
      } else {
        setMsgError(
          apiErrorText(
            res.error,
            t("Imeshindwa kutuma ujumbe.", "Failed to send message.")
          )
        );
      }
    } catch (err) {
      setMsgError(
        apiErrorText(
          err,
          t("Imeshindwa kutuma ujumbe.", "Failed to send message.")
        )
      );
    } finally {
      setSendingMsg(false);
    }
  };

  const handleLock = async (reason) => {
    if (actionBusy) return;
    setActionBusy(true);
    setActionError("");
    try {
      const res = await adminLockDealAsync(dealId, reason);
      if (res.ok) {
        setLockOpen(false);
      } else {
        setActionError(
          apiErrorText(res.error, t("Imeshindwa kusimamisha room.", "Failed to lock room."))
        );
      }
    } catch (err) {
      setActionError(apiErrorText(err, t("Imeshindwa kusimamisha room.", "Failed to lock room.")));
    } finally {
      setActionBusy(false);
    }
  };

  const handleUnlock = async (reason) => {
    if (actionBusy) return;
    setActionBusy(true);
    setActionError("");
    try {
      const res = await adminUnlockDealAsync(dealId, reason);
      if (res.ok) {
        setUnlockOpen(false);
      } else {
        setActionError(
          apiErrorText(res.error, t("Imeshindwa kufungua room.", "Failed to unlock room."))
        );
      }
    } catch (err) {
      setActionError(apiErrorText(err, t("Imeshindwa kufungua room.", "Failed to unlock room.")));
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancel = async (reason) => {
    if (actionBusy) return;
    setActionBusy(true);
    setActionError("");
    try {
      const res = await adminCancelDealAsync(dealId, reason);
      if (res.ok) {
        setCancelOpen(false);
      } else {
        setActionError(
          apiErrorText(res.error, t("Imeshindwa kughairi deal.", "Failed to cancel deal."))
        );
      }
    } catch (err) {
      setActionError(apiErrorText(err, t("Imeshindwa kughairi deal.", "Failed to cancel deal.")));
    } finally {
      setActionBusy(false);
    }
  };

  // Viungo vya backend zilizopo (resolve-dispute, expire-*, n.k.)
  const showResolveDispute =
    txnId && (deal.status === "disputed" || deal.buyerDecision === "REQUEST_NEGOTIATION");
  const showExpireReservation =
    txnId && deal.status === "reserved" && deal.reservationExpiresAt;
  const showExpireInspection =
    txnId && deal.inspectionStatus === "IN_PROGRESS";

  const baseAdminUrl = "/smk-control-9x7k";

  return (
    <div
      style={{
        borderColor: "rgba(47,109,79,0.3)",
        background: "rgba(47,109,79,0.04)",
      }}
      className="border rounded-lg p-3 flex flex-col gap-3"
    >
      <div className="flex items-center gap-1.5">
        <Shield size={13} color={COLORS.green} />
        <p
          className="text-[11px] font-bold uppercase"
          style={{ color: COLORS.green }}
        >
          {t("Vitendo vya Msimamizi", "Admin Actions")}
        </p>
      </div>

      {/* ── Hali ya sasa ── */}
      {isLocked && (
        <div
          style={{
            borderColor: "rgba(232,163,61,0.5)",
            background: "rgba(232,163,61,0.12)",
          }}
          className="rounded-lg border px-3 py-2 text-[11px] flex items-start gap-2"
        >
          <Lock size={12} color="#8A5A16" className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold" style={{ color: "#8A5A16" }}>
              {t("Room imesimamishwa", "Room is locked")}
            </p>
            {deal.lockedReason && (
              <p className="text-[10px] mt-0.5" style={{ color: "#8A5A16" }}>
                {t("Sababu", "Reason")}: {deal.lockedReason}
              </p>
            )}
            {deal.lockedByName && (
              <p className="text-[10px] mt-0.5 text-muted">
                {t("Na", "By")}: {deal.lockedByName}
              </p>
            )}
          </div>
        </div>
      )}

      {isCancelledByAdmin && (
        <div
          style={{
            borderColor: "rgba(193,80,46,0.4)",
            background: "rgba(193,80,46,0.08)",
          }}
          className="rounded-lg border px-3 py-2 text-[11px] flex items-start gap-2"
        >
          <Ban size={12} color={COLORS.rust} className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold" style={{ color: COLORS.rust }}>
              {t("Imeghairiwa na admin", "Cancelled by admin")}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: COLORS.rust }}>
              {t(
                "Haiwezi kufufuliwa na watumiaji — inahitaji support.",
                "Cannot be reopened by users — requires support."
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── Ujumbe wa admin ── */}
      {!isCancelled && (
        <div>
          <label className="text-[11px] font-semibold text-secondary block mb-1.5">
            {t("Tuma ujumbe kama Msimamizi", "Send message as Admin")}
          </label>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (msgError) setMsgError("");
            }}
            rows={2}
            maxLength={2000}
            placeholder={t(
              "Ujumbe utaonekana kwa pande zote mbili...",
              "Message will be visible to both parties..."
            )}
            style={{
              background: "white",
              borderColor: COLORS.sandLine,
              color: COLORS.night,
            }}
            className="w-full rounded-lg border px-3 py-2 text-xs outline-none resize-none"
          />
          {msgError && (
            <p className="text-[10px] mt-1" style={{ color: COLORS.rust }}>
              {msgError}
            </p>
          )}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSendMessage}
              disabled={sendingMsg || !message.trim()}
              style={{
                background: message.trim() ? COLORS.green : COLORS.sandLine,
                color: message.trim() ? "white" : "rgba(16,26,46,0.4)",
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg disabled:cursor-not-allowed"
            >
              {sendingMsg ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Send size={12} />
              )}
              {t("Tuma", "Send")}
            </button>
          </div>
        </div>
      )}

      {/* ── Lock / Unlock / Cancel ── */}
      {(canLock || canUnlock || canCancel) && (
        <div className="flex flex-col gap-2">
          {canLock && (
            <button
              onClick={() => {
                setActionError("");
                setLockOpen(true);
              }}
              style={{
                borderColor: "rgba(232,163,61,0.4)",
                color: "#8A5A16",
                background: "white",
              }}
              className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg border hover:bg-amber-50 transition-colors"
            >
              <Lock size={12} />
              {t("Simamisha Room (Lock)", "Suspend Room (Lock)")}
            </button>
          )}

          {canUnlock && (
            <button
              onClick={() => {
                setActionError("");
                setUnlockOpen(true);
              }}
              style={{
                borderColor: "rgba(47,109,79,0.4)",
                color: COLORS.green,
                background: "white",
              }}
              className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg border hover:bg-green-50 transition-colors"
            >
              <Unlock size={12} />
              {t("Fungua Room (Unlock)", "Reopen Room (Unlock)")}
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => {
                setActionError("");
                setCancelOpen(true);
              }}
              style={{
                borderColor: "rgba(193,80,46,0.4)",
                color: COLORS.rust,
                background: "white",
              }}
              className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg border hover:bg-red-50 transition-colors"
            >
              <Ban size={12} />
              {t("Ghairi Deal (Cancel)", "Cancel Deal")}
            </button>
          )}
        </div>
      )}

      {/* ── Viungo vya backend zilizopo ── */}
      {(showResolveDispute || showExpireReservation || showExpireInspection) && (
        <div>
          <p className="text-[10px] font-semibold text-secondary uppercase mb-1.5">
            {t("Vitendo vingine", "Other actions")}
          </p>
          <div className="flex flex-col gap-1.5">
            {showResolveDispute && (
              <a
                href={`${baseAdminUrl}/disputes?txn=${txnId}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  borderColor: "rgba(193,80,46,0.4)",
                  color: COLORS.rust,
                  background: "white",
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border hover:bg-red-50 transition-colors"
              >
                <Gavel size={11} />
                {t("Tatua Mgogoro (Resolve Dispute)", "Resolve Dispute")}
              </a>
            )}
            {showExpireReservation && (
              <a
                href={`${baseAdminUrl}/transactions?txn=${txnId}&action=expire-reservation`}
                target="_blank"
                rel="noreferrer"
                style={{
                  borderColor: COLORS.sandLine,
                  color: COLORS.night,
                  background: "white",
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <Timer size={11} />
                {t("Maliza Reservation", "Expire Reservation")}
              </a>
            )}
            {showExpireInspection && (
              <a
                href={`${baseAdminUrl}/transactions?txn=${txnId}&action=expire-inspection`}
                target="_blank"
                rel="noreferrer"
                style={{
                  borderColor: COLORS.sandLine,
                  color: COLORS.night,
                  background: "white",
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <Clock size={11} />
                {t("Maliza Ukaguzi", "Expire Inspection")}
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <ReasonModal
        open={lockOpen}
        title={t("Simamisha Room", "Suspend Room")}
        description={t(
          "Ujumbe na ofa zote zinasimama hadi utakapofungua. Sababu itaonekana kwa mnunuzi na muuzaji, na pande zote zitaarifiwa.",
          "All messages and offers will pause until you unlock. The reason will be visible to both buyer and seller, and both will be notified."
        )}
        confirmLabel={t("Simamisha", "Lock")}
        confirmColor={COLORS.rust}
        requireReason
        lang={lang}
        busy={actionBusy}
        error={actionError}
        placeholder={t(
          "Kwa nini unasimamisha? (mf. tunachunguza malalamiko)",
          "Why are you locking? (e.g. investigating a complaint)"
        )}
        onClose={() => setLockOpen(false)}
        onConfirm={handleLock}
      />
      <ReasonModal
        open={unlockOpen}
        title={t("Fungua Room", "Reopen Room")}
        description={t(
          "Room itarudi kuwa hai. Pande zote zitaarifiwa.",
          "The room will become active again. Both parties will be notified."
        )}
        confirmLabel={t("Fungua", "Unlock")}
        confirmColor={COLORS.green}
        requireReason={false}
        lang={lang}
        busy={actionBusy}
        error={actionError}
        placeholder={t(
          "Maelezo ya hiari...",
          "Optional note..."
        )}
        onClose={() => setUnlockOpen(false)}
        onConfirm={handleUnlock}
      />
      <ReasonModal
        open={cancelOpen}
        title={t("Ghairi Deal", "Cancel Deal")}
        description={t(
          "Deal itaghairiwa kabisa na haiwezi kufufuliwa na watumiaji. Pande zote zitaarifiwa.",
          "The deal will be cancelled permanently and cannot be reopened by users. Both parties will be notified."
        )}
        confirmLabel={t("Ghairi Deal", "Cancel Deal")}
        confirmColor={COLORS.rust}
        requireReason
        lang={lang}
        busy={actionBusy}
        error={actionError}
        placeholder={t(
          "Sababu ya kughairi (itaonekana kwa watumiaji)...",
          "Reason for cancelling (will be shown to users)..."
        )}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
      />
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

  // roomData inaweza kuwa ya zamani (stale) baada ya admin kutuma ujumbe /
  // kughairi — kwa hiyo tunaunganisha na messages za store kwa `id`.
  const messages = mergeMessages(
    Array.isArray(roomData?.messages) ? roomData.messages : [],
    Array.isArray(deal.messages) ? deal.messages : []
  );
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

      {/* ── MPYA: Admin Actions Panel ── */}
      <AdminActionsPanel deal={deal} lang={lang} />

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
                key={r.id ?? r.code}
                className="text-[11px] text-secondary flex items-start gap-2"
              >
                <AlertTriangle
                  size={11}
                  color={COLORS.rust}
                  className="shrink-0 mt-0.5"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-primary">
                    {(r.reporter_role ?? r.reporterRole) === "buyer"
                      ? t("Mnunuzi", "Buyer")
                      : t("Muuzaji", "Seller")}
                    {" → "}
                    {r.reported_user_name || r.reportedUserName || "—"}
                  </p>
                  <p className="text-muted">
                    {r.report_reason ?? r.reportReason} ·{" "}
                    {r.code ?? r.ticketCode}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
              { timeZone: "Africa/Dar_es_Salaam" }
            )}
            color={COLORS.rust}
          />
        )}
      </div>

      {/* Download */}
      <DownloadBar dealId={deal.id} deal={deal} messages={messages} lang={lang} />

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
          "Admin view — unaweza kutuma ujumbe kama msimamizi, kusimamisha room, au kughairi.",
          "Admin view — you can send messages as admin, lock the room, or cancel."
        )}
      </p>
    </div>
  );
}