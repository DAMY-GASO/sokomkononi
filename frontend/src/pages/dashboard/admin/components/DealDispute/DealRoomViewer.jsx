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
  Banknote,
} from "lucide-react";
import { COLORS, formatTZS, timeAgo } from "../../shared/constants.js";
import MessageBubble from "../../shared/MessageBubble.jsx";
import AppealReasonCard from "./AppealReasonCard.jsx";
import {
  getDealTranscript,
  adminSendMessageAsync,
  adminLockDealAsync,
  adminUnlockDealAsync,
  adminCancelDealAsync,
  adminResolveDisputeAsync,
  adminRefundDealAsync,
  adminExpireReservationAsync,
  adminExpireInspectionAsync,
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
    first(d?.note) ||
    first(d?.resolution) ||
    first(d?.action) ||
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
  [...primary, ...secondary].forEach((raw, i) => {
    const key = raw?.id != null ? `id:${raw.id}` : `idx:${i}`;
    if (seen.has(key)) return;
    seen.add(key);
    // roomData ni raw ya seva (snake_case): sawazisha na umbo la frontend
    // ili picha na ujumbe wa mfumo vionekane kwa admin.
    const m = raw
      ? {
          ...raw,
          imageUrl:
            raw.imageUrl || raw.attachment_url || raw.attachmentUrl || null,
          systemCode: raw.systemCode || raw.system_code || null,
          systemData: raw.systemData || raw.system_data || {},
          senderName: raw.senderName || raw.sender_name || "",
          senderId: raw.senderId ?? raw.sender_id ?? null,
          at: raw.at || raw.created_at || null,
        }
      : raw;
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
        if (m.kind === "SYSTEM" || m.sender === "system") {
          return t("Mfumo", "System");
        }
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
      style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
      className="border rounded-lg px-3 py-2.5"
    >
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Download size={12} color={COLORS.night} />
          <p className="text-xs font-semibold text-secondary uppercase">
            {t("Pakua Mazungumzo", "Download Transcript")}
          </p>
        </div>
        <p className="text-xs text-muted">
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
            className="text-xs font-semibold px-2 py-2 rounded-lg border bg-card hover:bg-page transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
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
        <p className="text-xs mt-2" style={{ color: COLORS.rust }}>
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
        style={{ background: "rgb(var(--c-card))", borderColor: COLORS.sandLine }}
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
                <Loader2 size={14} className="animate-spin" />
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
// MODAL — tatua mgogoro (chagua uamuzi + maelezo)
// ============================================================
function ResolveDisputeModal({
  open,
  busy = false,
  error = "",
  lang = "sw",
  onClose,
  onConfirm,
}) {
  const [resolution, setResolution] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) {
      setResolution("");
      setNote("");
    }
  }, [open]);

  const t = (sw, en) => (lang === "sw" ? sw : en);
  if (!open) return null;

  const canSubmit = !busy && !!resolution && note.trim().length > 0;
  const options = [
    {
      value: "COMPLETED",
      title: t("Heshimu mauzo (Completed)", "Honour the sale (Completed)"),
      desc: t(
        "Muamala unakamilika na tangazo linawekwa SOLD.",
        "The transaction completes and the listing is marked SOLD."
      ),
    },
    {
      value: "CANCELLED",
      title: t("Ghairi muamala (Cancelled)", "Cancel the transaction (Cancelled)"),
      desc: t(
        "Muamala unaghairiwa na tangazo linarudi hewani (LIVE).",
        "The transaction is cancelled and the listing goes back LIVE."
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60">
      <div
        style={{ background: "rgb(var(--c-card))", borderColor: COLORS.sandLine }}
        className="rounded-2xl border w-full max-w-md p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-primary text-base font-bold">
            {t("Tatua Mgogoro", "Resolve Dispute")}
          </h3>
          <button
            onClick={onClose}
            disabled={busy}
            className="text-muted hover:text-secondary p-1 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-secondary mb-3">
          {t(
            "Uamuzi huu ni wa mwisho. Mnunuzi na muuzaji wataarifiwa, na maelezo yako yatarekodiwa kwenye audit log.",
            "This decision is final. Buyer and seller will be notified and your note is recorded in the audit log."
          )}
        </p>
        <div className="flex flex-col gap-2 mb-3">
          {options.map((o) => {
            const active = resolution === o.value;
            return (
              <button
                key={o.value}
                type="button"
                disabled={busy}
                onClick={() => setResolution(o.value)}
                style={{
                  borderColor: active ? COLORS.green : COLORS.sandLine,
                  background: active ? "rgba(47,109,79,0.08)" : "transparent",
                }}
                className="text-left rounded-lg border px-3 py-2 disabled:opacity-50"
              >
                <p className="text-xs font-semibold text-primary">{o.title}</p>
                <p className="text-xs text-secondary mt-0.5">{o.desc}</p>
              </button>
            );
          })}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={t(
            "Maelezo ya uamuzi (yanaonekana kwa pande zote)...",
            "Decision note (visible to both parties)..."
          )}
          style={{
            background: COLORS.sand,
            borderColor: COLORS.sandLine,
            color: COLORS.night,
          }}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none mb-3"
        />
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
            onClick={() => onConfirm({ resolution, note: note.trim() })}
            disabled={!canSubmit}
            style={{
              background: canSubmit ? COLORS.rust : COLORS.sandLine,
              color: "white",
            }}
            className="flex-1 text-sm font-semibold px-3 py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                {t("Inatuma...", "Sending...")}
              </span>
            ) : (
              t("Thibitisha Uamuzi", "Confirm Decision")
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
  const [resolveOpen, setResolveOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [expireResOpen, setExpireResOpen] = useState(false);
  const [expireInspOpen, setExpireInspOpen] = useState(false);
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

  // ── Vitendo vya transaction (vinaendeshwa hapa hapa, bila kuhama ukurasa) ──
  const txnStatus = String(deal?.transactionStatus || "").toUpperCase();
  const resStatus = String(deal?.reservationStatus || "").toUpperCase();
  const inspStatus = String(deal?.inspectionStatus || "").toUpperCase();
  const refundable = Number(deal?.refundableAmount) || 0;

  const showResolveDispute = !!txnId && txnStatus === "DISPUTED";
  const showExpireReservation = !!txnId && resStatus === "ACTIVE";
  const showExpireInspection = !!txnId && inspStatus === "ACTIVE";
  // Refund inaruhusiwa tu deal ikiisha (backend pia inalinda sheria hii)
  const showRefund =
    !!txnId &&
    refundable > 0 &&
    (txnStatus === "CANCELLED" ||
      resStatus === "CANCELLED" ||
      resStatus === "EXPIRED");

  const runAction = async (fn, close, fallback) => {
    if (actionBusy) return;
    setActionBusy(true);
    setActionError("");
    try {
      const res = await fn();
      if (res.ok) {
        close();
      } else {
        setActionError(apiErrorText(res.error, fallback));
      }
    } catch (err) {
      setActionError(apiErrorText(err, fallback));
    } finally {
      setActionBusy(false);
    }
  };

  const handleResolveDispute = ({ resolution, note }) =>
    runAction(
      () => adminResolveDisputeAsync(dealId, { resolution, note }),
      () => setResolveOpen(false),
      t("Imeshindwa kutatua mgogoro.", "Failed to resolve dispute.")
    );

  const handleRefund = (reason) =>
    runAction(
      () => adminRefundDealAsync(dealId, reason),
      () => setRefundOpen(false),
      t("Imeshindwa kuomba refund.", "Failed to request refund.")
    );

  const handleExpireReservation = () =>
    runAction(
      () => adminExpireReservationAsync(dealId),
      () => setExpireResOpen(false),
      t("Imeshindwa kumaliza reservation.", "Failed to expire reservation.")
    );

  const handleExpireInspection = () =>
    runAction(
      () => adminExpireInspectionAsync(dealId),
      () => setExpireInspOpen(false),
      t("Imeshindwa kumaliza ukaguzi.", "Failed to expire inspection.")
    );

  const openModal = (setter) => () => {
    setActionError("");
    setter(true);
  };

  return (
    <div
      style={{
        borderColor: "rgba(47,109,79,0.3)",
        background: "rgba(47,109,79,0.04)",
      }}
      className="border rounded-lg p-3 flex flex-col gap-3"
    >
      <div className="flex items-center gap-1.5">
        <Shield size={14} color={COLORS.green} />
        <p
          className="text-xs font-bold uppercase"
          style={{ color: COLORS.green }}
        >
          {t("Vitendo vya Msimamizi", "Admin Actions")}
        </p>
      </div>

      {/* ── Hali ya sasa ── */}
      {isLocked && (
        <div
          style={{
            borderColor: "rgba(254,164,6,0.5)",
            background: "rgba(254,164,6,0.12)",
          }}
          className="rounded-lg border px-3 py-2 text-xs flex items-start gap-2"
        >
          <Lock size={12} color={COLORS.goldText} className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold" style={{ color: COLORS.goldText }}>
              {t("Room imesimamishwa", "Room is locked")}
            </p>
            {deal.lockedReason && (
              <p className="text-xs mt-0.5" style={{ color: COLORS.goldText }}>
                {t("Sababu", "Reason")}: {deal.lockedReason}
              </p>
            )}
            {deal.lockedByName && (
              <p className="text-xs mt-0.5 text-muted">
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
          className="rounded-lg border px-3 py-2 text-xs flex items-start gap-2"
        >
          <Ban size={12} color={COLORS.rust} className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold" style={{ color: COLORS.rust }}>
              {t("Imeghairiwa na admin", "Cancelled by admin")}
            </p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.rust }}>
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
          <label className="text-xs font-semibold text-secondary block mb-1.5">
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
              background: "rgb(var(--c-card))",
              borderColor: COLORS.sandLine,
              color: COLORS.night,
            }}
            className="w-full rounded-lg border px-3 py-2 text-xs outline-none resize-none"
          />
          {msgError && (
            <p className="text-xs mt-1" style={{ color: COLORS.rust }}>
              {msgError}
            </p>
          )}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSendMessage}
              disabled={sendingMsg || !message.trim()}
              style={{
                background: message.trim() ? COLORS.green : COLORS.sandLine,
                color: message.trim() ? "white" : "rgba(1,25,87,0.4)",
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:cursor-not-allowed"
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
                borderColor: "rgba(254,164,6,0.4)",
                color: COLORS.goldText,
                background: "rgb(var(--c-card))",
              }}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-gold/10 transition-colors"
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
                background: "rgb(var(--c-card))",
              }}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-green/10 transition-colors"
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
                background: "rgb(var(--c-card))",
              }}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-rust/10 transition-colors"
            >
              <Ban size={12} />
              {t("Ghairi Deal (Cancel)", "Cancel Deal")}
            </button>
          )}
        </div>
      )}

      {/* ── Vitendo vya transaction / malipo ── */}
      {(showResolveDispute ||
        showRefund ||
        showExpireReservation ||
        showExpireInspection) && (
        <div>
          <p className="text-xs font-semibold text-secondary uppercase mb-1.5">
            {t("Vitendo vingine", "Other actions")}
          </p>
          <div className="flex flex-col gap-1.5">
            {showResolveDispute && (
              <button
                type="button"
                onClick={openModal(setResolveOpen)}
                style={{
                  borderColor: "rgba(193,80,46,0.4)",
                  color: COLORS.rust,
                  background: "rgb(var(--c-card))",
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-rust/10 transition-colors"
              >
                <Gavel size={12} />
                {t("Tatua Mgogoro (Resolve Dispute)", "Resolve Dispute")}
              </button>
            )}
            {showRefund && (
              <button
                type="button"
                onClick={openModal(setRefundOpen)}
                style={{
                  borderColor: "rgba(47,109,79,0.4)",
                  color: COLORS.green,
                  background: "rgb(var(--c-card))",
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-green/10 transition-colors"
              >
                <Banknote size={12} />
                {t("Rudisha Malipo (Refund)", "Refund Payments")} · {formatTZS(refundable)}
              </button>
            )}
            {showExpireReservation && (
              <button
                type="button"
                onClick={openModal(setExpireResOpen)}
                style={{
                  borderColor: COLORS.sandLine,
                  color: COLORS.night,
                  background: "rgb(var(--c-card))",
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-page transition-colors"
              >
                <Timer size={12} />
                {t("Maliza Reservation", "Expire Reservation")}
              </button>
            )}
            {showExpireInspection && (
              <button
                type="button"
                onClick={openModal(setExpireInspOpen)}
                style={{
                  borderColor: COLORS.sandLine,
                  color: COLORS.night,
                  background: "rgb(var(--c-card))",
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-page transition-colors"
              >
                <Clock size={12} />
                {t("Maliza Ukaguzi", "Expire Inspection")}
              </button>
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
        description={
          t(
            "Deal itaghairiwa kabisa na haiwezi kufufuliwa na watumiaji. Pande zote zitaarifiwa.",
            "The deal will be cancelled permanently and cannot be reopened by users. Both parties will be notified."
          ) +
          (txnId
            ? " " +
              t(
                "Muamala unaoendelea (reservation/ukaguzi) pia utaghairiwa na tangazo litarudi hewani.",
                "The ongoing transaction (reservation/inspection) is cancelled too and the listing goes back live."
              )
            : "") +
          (refundable > 0
            ? " " +
              t(
                `Ada ya reservation (${formatTZS(refundable)}) HAITARUDISHWA kiotomatiki — tumia "Rudisha Malipo" baada ya kughairi ukipenda.`,
                `The reservation fee (${formatTZS(refundable)}) is NOT refunded automatically — use "Refund Payments" after cancelling if needed.`
              )
            : "")
        }
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
      <ResolveDisputeModal
        open={resolveOpen}
        lang={lang}
        busy={actionBusy}
        error={actionError}
        onClose={() => setResolveOpen(false)}
        onConfirm={handleResolveDispute}
      />
      <ReasonModal
        open={refundOpen}
        title={t("Rudisha Malipo", "Refund Payments")}
        description={t(
          `Itaundwa refund ya ${formatTZS(refundable)} (ada ya reservation na extensions zilizolipwa) kwenye ukurasa wa Refunds, ikisubiri ukamilishe malipo kwa mkono. Mnunuzi atapewa taarifa.`,
          `A ${formatTZS(refundable)} refund (paid reservation fee and extensions) will be created on the Refunds page, waiting for you to complete the payout manually. The buyer will be notified.`
        )}
        confirmLabel={t("Omba Refund", "Request Refund")}
        confirmColor={COLORS.green}
        requireReason
        lang={lang}
        busy={actionBusy}
        error={actionError}
        placeholder={t(
          "Sababu ya refund (inaingia kwenye audit)...",
          "Reason for the refund (recorded in audit)..."
        )}
        onClose={() => setRefundOpen(false)}
        onConfirm={handleRefund}
      />
      <ReasonModal
        open={expireResOpen}
        title={t("Maliza Reservation", "Expire Reservation")}
        description={t(
          "Reservation itaisha sasa hivi na tangazo litarudi hewani. Ada haitarudishwa kiotomatiki.",
          "The reservation ends now and the listing goes back live. The fee is not refunded automatically."
        )}
        confirmLabel={t("Maliza", "Expire")}
        confirmColor={COLORS.rust}
        requireReason={false}
        lang={lang}
        busy={actionBusy}
        error={actionError}
        onClose={() => setExpireResOpen(false)}
        onConfirm={handleExpireReservation}
      />
      <ReasonModal
        open={expireInspOpen}
        title={t("Maliza Ukaguzi", "Expire Inspection")}
        description={t(
          "Muda wa ukaguzi utaisha sasa hivi. Kama mnunuzi hajatoa uamuzi, mgogoro utafunguliwa.",
          "The inspection period ends now. If the buyer has not decided, a dispute is opened."
        )}
        confirmLabel={t("Maliza", "Expire")}
        confirmColor={COLORS.rust}
        requireReason={false}
        lang={lang}
        busy={actionBusy}
        error={actionError}
        onClose={() => setExpireInspOpen(false)}
        onConfirm={handleExpireInspection}
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

      {/* Sababu ya rufaa/mgogoro */}
      <AppealReasonCard deal={deal} lang={lang} />

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
              className="text-xs font-semibold uppercase"
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
                className="text-xs text-secondary flex items-start gap-2"
              >
                <AlertTriangle
                  size={12}
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
        style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
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
        style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
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
          <p className="text-xs font-semibold text-secondary uppercase mb-1.5">
            {t("Uthibitisho wa Malipo", "Payment Proof")}
          </p>
          <div
            style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
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
                className="flex items-center gap-1.5 text-xs font-semibold text-green hover:underline mt-1"
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
          <p className="text-xs font-semibold text-secondary uppercase">
            {t("Historia ya Mazungumzo", "Message History")}
          </p>
          {messageCount > 0 && (
            <span className="text-xs text-muted">
              {messageCount} {t("ujumbe", "messages")}
            </span>
          )}
        </div>
        <div
          style={{ borderColor: COLORS.sandLine }}
          className="max-h-72 sm:max-h-96 overflow-y-auto flex flex-col gap-2 bg-page/50 border rounded-lg p-2.5 sm:p-3"
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
      <p className="text-xs text-muted text-center">
        {t(
          "Admin view — unaweza kutuma ujumbe kama msimamizi, kusimamisha room, au kughairi.",
          "Admin view — you can send messages as admin, lock the room, or cancel."
        )}
      </p>
    </div>
  );
}