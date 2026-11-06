// ============================================================
// src/pages/dashboard/components/DealRooms.jsx
// ============================================================
import React, { useState, useRef, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Send, Check, X, HandCoins, MapPin,
  ChevronDown, CreditCard, ShieldCheck, CheckCircle2,
  AlertTriangle, Ban, Upload, FileImage, ThumbsDown, PartyPopper,
  Paperclip, Loader2, Lock, Flag, MoreVertical, UserRound, LogOut,
  RotateCcw, Clock, CheckCheck, AlertCircle,
} from "lucide-react";
import { COLORS, getCategory, formatTZS, timeAgo } from "./shared";
import {
  useActiveReservationTiers,
  useReservationSettings,
  calcReservationFee,
} from "../../../config/feePolicy.js";
import {
  useDeals,
  updateDeal as updateDealInStore,
  sendOfferAsync,
  acceptOfferAsync,
  fetchDealDetailAsync,
} from "../../../config/dealsStore.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { checkCredit } from "../../../config/userCreditsStore.js";
import { dealsApi } from "../../../api/deals.js";
import { transactionsApi } from "../../../api/transactions.js";
import ContactDrawer from "../../../components/ContactDrawer.jsx";
import ErrorCallout from "../../../components/ErrorCallout.jsx";
import { explainApiError } from "../../../api/apiErrors.js";
import { reopenDealRoom } from "../../../api/dealReopen.js";

import {
  createTransactionAsync,
  createReservationAsync,
  payReservationAsync,
  pollReservationStatusAsync,
  submitDecisionAsync,
  uploadFinalPaymentAsync,
  confirmPaymentAsync,
  cancelTransactionAsync,
  TX_STATUS,
} from "../../../config/transactionsStore.js";

// ============================================================
// HELPERS
// ============================================================
function getMessageText(m, lang) {
  if (!m.text) return "";
  if (typeof m.text === "string") return m.text;
  return m.text?.[lang] || m.text?.sw || "";
}

// Saa ya kutumwa (mf. 14:05) — kwa saa za kifaa cha mtumiaji
function formatMsgTime(at) {
  if (!at) return "";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
  return da.toDateString() === db.toDateString();
}

function formatDayLabel(at, lang) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())
    return lang === "sw" ? "Leo" : "Today";
  if (d.toDateString() === yesterday.toDateString())
    return lang === "sw" ? "Jana" : "Yesterday";
  return d.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-GB", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

// Inaunganisha data ya seva na ujumbe wa ndani ambao bado haujafika
// (unatumwa / umeshindwa) ili polling isiufute.
function mergeServerDeal(prev, serverDeal) {
  if (!serverDeal) return prev;
  if (!Array.isArray(serverDeal.messages)) return { ...prev, ...serverDeal };
  const serverMsgs = serverDeal.messages;
  const pendingLocal = (prev?.messages || []).filter(
    (m) =>
      (m.sendStatus === "failed" || m.sendStatus === "sending") &&
      !serverMsgs.some((s) => String(s.id) === String(m.id))
  );
  return { ...prev, ...serverDeal, messages: [...serverMsgs, ...pendingLocal] };
}

// Muda + alama ya hali chini ya kila ujumbe
function MessageMeta({ m, mine, lang, onRetry }) {
  const time = formatMsgTime(m.at);
  const sendStatus = m.sendStatus || "sent";
  const isRead = !!(m.readAt || m.read_at || m.isRead || m.read || m.seenAt);
  const isDelivered = !!(m.deliveredAt || m.delivered_at);

  if (mine && sendStatus === "failed") {
    return (
      <div
        className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium"
        style={{ color: COLORS.rust }}
      >
        <AlertCircle size={12} />
        <span>{lang === "sw" ? "Haikutumwa" : "Not sent"}</span>
        <button
          type="button"
          onClick={() => onRetry?.(m.id)}
          className="underline font-semibold inline-flex items-center gap-0.5"
        >
          <RotateCcw size={10} />
          {lang === "sw" ? "Jaribu tena" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 mt-0.5 text-[11px]"
      style={{ color: "rgba(16,26,46,0.5)" }}
    >
      {time && <span>{time}</span>}
      {mine && sendStatus === "sending" && (
        <>
          <Clock size={11} />
          <span>{lang === "sw" ? "Inatuma..." : "Sending..."}</span>
        </>
      )}
      {mine && sendStatus !== "sending" && (
        isRead ? (
          <CheckCheck
            size={13}
            color={COLORS.green}
            aria-label={lang === "sw" ? "Imesomwa" : "Read"}
          />
        ) : isDelivered ? (
          <CheckCheck
            size={13}
            aria-label={lang === "sw" ? "Imefika" : "Delivered"}
          />
        ) : (
          <Check
            size={13}
            aria-label={lang === "sw" ? "Imetumwa" : "Sent"}
          />
        )
      )}
    </div>
  );
}

function formatMoneyInput(value) {
  if (!value) return "";
  const digits = String(value).replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function cleanMoneyInput(value) {
  return String(value).replace(/[^0-9]/g, "");
}

function cleanPhoneInput(value) {
  return String(value || "").replace(/[^\d+]/g, "").slice(0, 15);
}

function cleanCardInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function isMobileMoneyMethod(m) {
  return (
    m === "M-Pesa" ||
    m === "Mixx by Yas" ||
    m === "Airtel Money" ||
    m === "HaloPesa"
  );
}

function isBankMethod(m) {
  const s = String(m || "").toLowerCase();
  return (
    s.includes("benki") ||
    s.includes("bank") ||
    s.includes("card") ||
    s.includes("kadi")
  );
}

async function callApiOrFallback(apiCall) {
  try {
    const res = await apiCall();
    return { ...res, offline: false };
  } catch (err) {
    const status = err?.status;
    if (status === 404 || status === 501) {
      console.error(
        "[DealRooms] Backend endpoint haipo (404/501). Hakuna local fallback.",
        err
      );
      return { ok: false, error: err, offline: true };
    }
    return { ok: false, error: err, offline: false };
  }
}

const FALLBACK_DEAL_STATUS = (lang, key) => ({
  label: key
    ? String(key).replace(/_/g, " ")
    : lang === "sw"
      ? "Inaendelea"
      : "In Progress",
  bg: "rgba(47,109,79,0.12)",
  fg: COLORS.green,
});

const getDealStatus = (lang) => ({
  open: {
    label: lang === "sw" ? "Wazi" : "Open",
    bg: "rgba(47,109,79,0.12)",
    fg: COLORS.green,
  },
  pending: {
    label: lang === "sw" ? "Inasubiri" : "Pending",
    bg: "rgba(232,163,61,0.16)",
    fg: "#8A5A16",
  },
  negotiating: {
    label: lang === "sw" ? "Inaendelea" : "Negotiating",
    bg: "rgba(47,109,79,0.12)",
    fg: COLORS.green,
  },
  offer_sent: {
    label: lang === "sw" ? "Ofa Imetumwa" : "Offer Sent",
    bg: "rgba(232,163,61,0.16)",
    fg: "#8A5A16",
  },
  accepted: {
    label: lang === "sw" ? "Imekubaliwa" : "Accepted",
    bg: "rgba(47,109,79,0.16)",
    fg: COLORS.green,
  },
  declined: {
    label: lang === "sw" ? "Imekataliwa" : "Declined",
    bg: "rgba(193,80,46,0.12)",
    fg: COLORS.rust,
  },
  reserved: {
    label: lang === "sw" ? "Kipindi cha Ukaguzi" : "Inspection Period",
    bg: "rgba(16,26,46,0.08)",
    fg: COLORS.night,
  },
  awaiting_final_payment: {
    label:
      lang === "sw"
        ? "Tayari kwa Malipo ya Mwisho"
        : "Ready for Final Payment",
    bg: "rgba(37,99,235,0.12)",
    fg: "#2563EB",
  },
  payment_proof_submitted: {
    label: lang === "sw" ? "Uthibitisho Umetumwa" : "Proof Submitted",
    bg: "rgba(232,163,61,0.16)",
    fg: "#8A5A16",
  },
  completed: {
    label: lang === "sw" ? "Imekamilika" : "Completed",
    bg: "rgba(47,109,79,0.18)",
    fg: COLORS.green,
  },
  disputed: {
    label:
      lang === "sw"
        ? "Mgogoro — Chini ya Ukaguzi"
        : "Dispute — Under Review",
    bg: "rgba(193,80,46,0.16)",
    fg: COLORS.rust,
  },
  cancelled: {
    label: lang === "sw" ? "Imeghairiwa" : "Cancelled",
    bg: "rgba(16,26,46,0.08)",
    fg: COLORS.night,
  },
});

const PAYMENT_METHODS = [
  "M-Pesa",
  "Mixx by Yas",
  "Airtel Money",
  "HaloPesa",
  "Benki (CRDB)",
];

const REVIVABLE_STATUSES = ["cancelled", "declined"];

function formatHours(hours, lang) {
  if (hours % 24 === 0) {
    const days = hours / 24;
    return lang === "sw"
      ? `Saa ${hours} (Siku ${days})`
      : `${hours} hrs (${days} days)`;
  }
  return lang === "sw" ? `Saa ${hours}` : `${hours} hrs`;
}

// ============================================================
// PAYMENT PROOF PANEL
// ============================================================
function PaymentProofPanel({ deal, onSubmit, lang }) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const canSubmit = !!file && reference.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        file,
        fileName,
        dataUrl: preview,
        reference: reference.trim(),
        method,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="border-t px-3 sm:px-4 py-3 flex flex-col gap-3"
    >
      <div className="flex flex-col items-center text-center gap-2">
        <Upload size={14} color={COLORS.night} />
        <p className="text-primary text-body-sm font-semibold">
          {lang === "sw"
            ? `Pakia Uthibitisho wa Malipo ya Mwisho — ${formatTZS(
                deal.currentOffer
              )}`
            : `Upload Final Payment Proof — ${formatTZS(
                deal.currentOffer
              )}`}
        </p>
        <p className="text-secondary text-body-sm max-w-md mx-auto">
          {lang === "sw"
            ? `Lipa ${formatTZS(
                deal.currentOffer
              )} moja kwa moja kwa muuzaji (M-Pesa/Benki/n.k), kisha pakia risiti au screenshot ya malipo hapa.`
            : `Pay ${formatTZS(
                deal.currentOffer
              )} directly to the seller (M-Pesa/Bank/etc.), then upload the receipt or payment screenshot here.`}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
          className="rounded-xl border p-2.5 flex items-center gap-3"
        >
          <img
            src={preview}
            alt="Receipt"
            className="w-14 h-14 rounded-lg object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-primary text-body-sm font-medium truncate">
              {fileName}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ color: COLORS.green }}
              className="text-body-sm font-semibold"
            >
              {lang === "sw" ? "Badilisha picha" : "Change image"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            borderColor: COLORS.sandLine,
            color: "rgba(16,26,46,0.55)",
          }}
          className="rounded-xl border-2 border-dashed py-5 flex flex-col items-center gap-1.5"
        >
          <FileImage size={22} color="rgba(16,26,46,0.35)" />
          <span className="text-body-sm font-medium">
            {lang === "sw"
              ? "Bofya kupakia risiti/screenshot"
              : "Click to upload receipt/screenshot"}
          </span>
        </button>
      )}

      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder={
          lang === "sw"
            ? "Namba ya muamala / Reference (mf. QGH7X92K1)"
            : "Transaction number / Reference (e.g. QGH7X92K1)"
        }
        style={{
          background: COLORS.sand,
          borderColor: COLORS.sandLine,
          color: COLORS.night,
        }}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none text-center"
      />

      <div className="grid grid-cols-2 gap-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            style={{
              borderColor: method === m ? COLORS.green : COLORS.sandLine,
              background: method === m ? "rgba(47,109,79,0.08)" : "white",
              color: COLORS.night,
            }}
            className="rounded-lg border px-2.5 py-2 text-body-sm font-medium text-center"
          >
            {m}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          background: canSubmit ? COLORS.green : COLORS.sandLine,
          color: canSubmit ? "white" : "rgba(16,26,46,0.4)",
        }}
        className="text-body-sm font-semibold px-3 py-2.5 rounded-lg disabled:cursor-not-allowed"
      >
        {submitting
          ? lang === "sw"
            ? "Inatuma..."
            : "Submitting..."
          : lang === "sw"
            ? "Tuma Uthibitisho wa Malipo"
            : "Submit Payment Proof"}
      </button>
    </div>
  );
}

// ============================================================
// PAYMENT PROOF REVIEW
// ============================================================
function PaymentProofReview({ deal, onConfirm, onReject, lang }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const proof = deal.paymentProof;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await onReject(reason.trim());
      setRejecting(false);
      setReason("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="border-t px-3 sm:px-4 py-3 flex flex-col gap-3"
    >
      <div className="flex flex-col items-center text-center gap-2">
        <Paperclip size={14} color={COLORS.night} />
        <p className="text-primary text-body-sm font-semibold">
          {lang === "sw"
            ? "Uthibitisho wa Malipo kutoka kwa Mnunuzi"
            : "Payment Proof from Buyer"}
        </p>
      </div>

      {proof && (
        <div
          style={{
            borderColor: COLORS.sandLine,
            background: COLORS.sand,
          }}
          className="rounded-xl border p-3 flex items-center gap-3"
        >
          {proof.dataUrl && (
            <img
              src={proof.dataUrl}
              alt="Payment receipt"
              className="w-16 h-16 rounded-lg object-cover shrink-0"
            />
          )}
          <div className="min-w-0 text-body-sm">
            <p className="text-primary font-semibold">
              {formatTZS(deal.currentOffer)} · {proof.method}
            </p>
            <p className="text-secondary mt-0.5">
              Ref: <span className="font-mono">{proof.reference}</span>
            </p>
            <p className="text-muted mt-0.5">
              {lang === "sw" ? "Zimetumwa" : "Submitted"}{" "}
              {timeAgo(proof.submittedAt, lang)}
            </p>
          </div>
        </div>
      )}

      {!rejecting ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRejecting(true)}
            disabled={busy}
            style={{
              borderColor: "rgba(193,80,46,0.35)",
              color: COLORS.rust,
            }}
            className="flex items-center gap-1.5 text-body-sm font-semibold px-3 py-2 rounded-lg border disabled:opacity-50"
          >
            <ThumbsDown size={13} />{" "}
            {lang === "sw" ? "Bado Sijapokea" : "Not Received Yet"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            style={{ background: COLORS.green, color: "white" }}
            className="flex-1 flex items-center justify-center gap-1.5 text-body-sm font-semibold px-3 py-2.5 rounded-lg disabled:opacity-70"
          >
            <Check size={14} />{" "}
            {busy
              ? lang === "sw"
                ? "Inathibitisha..."
                : "Confirming..."
              : lang === "sw"
                ? "Nimepokea Malipo — Kamilisha"
                : "Payment Received — Complete"}
          </button>
        </div>
      ) : (
        <>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              lang === "sw"
                ? "Kwa nini bado hujapokea? (hiari)"
                : "Why haven't you received it? (optional)"
            }
            rows={2}
            style={{
              background: COLORS.sand,
              borderColor: COLORS.sandLine,
              color: COLORS.night,
            }}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none text-center"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRejecting(false)}
              disabled={busy}
              style={{
                borderColor: COLORS.sandLine,
                color: COLORS.night,
              }}
              className="text-body-sm font-semibold px-3 py-2 rounded-lg border disabled:opacity-50"
            >
              {lang === "sw" ? "Ghairi" : "Cancel"}
            </button>
            <button
              onClick={handleReject}
              disabled={busy}
              style={{ background: COLORS.rust, color: "white" }}
              className="flex-1 text-body-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-60"
            >
              {lang === "sw"
                ? "Tuma — Muulize Mnunuzi Apakie Tena"
                : "Send — Ask Buyer to Re-upload"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// RESERVATION MODAL
// ============================================================
function ReservationModal({ open, onClose, deal, lang, user, onConfirm }) {
  const [step, setStep] = useState("choose");
  const [selectedHours, setSelectedHours] = useState(null);
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [paymentMode, setPaymentMode] = useState("flat");

  const [phone, setPhone] = useState(user?.phone || "");
  const [cardNumber, setCardNumber] = useState("");

  const settings = useReservationSettings();
  const tiers = useActiveReservationTiers();
  const isFeeDisabled = settings?.is_enabled === false;

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (!open) {
      setStep("choose");
      setError("");
      return;
    }
    if (selectedHours == null && tiers.length > 0) {
      setSelectedHours(tiers[0].hours);
    }
  }, [open, tiers, selectedHours]);

  const selectedTier = tiers.find((t) => t.hours === selectedHours);
  const hours = selectedTier?.hours ?? 0;
  const fee = isFeeDisabled ? 0 : calcReservationFee(hours);
  const validSelection = !!selectedTier;

  const creditInfo = checkCredit(user?.id, "reservation");
  const hasCredit = creditInfo.hasCredit && !isFeeDisabled;
  const reservationCreditRemaining = creditInfo.remaining || 0;

  const handlePay = async () => {
    if (!validSelection) return;

    if (isFeeDisabled && paymentMode !== "credit") {
      setPaying(true);
      try {
        await onConfirm({ hours, fee: 0, method: "free", phone: null, cardNumber: null });
      } finally {
        setPaying(false);
      }
      return;
    }

    if (paymentMode === "credit") {
      setPaying(true);
      setError("");
      try {
        await onConfirm({ hours, fee: 0, method: "credits", phone: null, cardNumber: null });
      } finally {
        setPaying(false);
      }
      return;
    }

    if (isMobileMoneyMethod(method)) {
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      if (cleanPhone.length < 9) {
        setError(
          t(
            "Tafadhali ingiza namba ya simu sahihi (mfano 0712345678).",
            "Please enter a valid phone number (e.g. 0712345678)."
          )
        );
        return;
      }
    }

    if (isBankMethod(method)) {
      const cleanCard = String(cardNumber || "").replace(/\D/g, "");
      if (cleanCard.length < 12) {
        setError(
          t(
            "Tafadhali ingiza namba ya kadi sahihi (tarakimu 12+).",
            "Please enter a valid card number (12+ digits)."
          )
        );
        return;
      }
    }

    setPaying(true);
    setError("");
    try {
      await onConfirm({
        hours,
        fee,
        method,
        phone: isMobileMoneyMethod(method) ? phone.trim() : null,
        cardNumber: isBankMethod(method) ? cardNumber.trim() : null,
      });
    } finally {
      setPaying(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div
          className="flex items-center justify-between px-5 pt-5 pb-3 border-b"
          style={{ borderColor: COLORS.sandLine }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: COLORS.green }}
            >
              <ShieldCheck size={16} color="white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">
                {t("Hifadhi Mali Hii", "Reserve This Property")}
              </h3>
              <p className="text-[11px] text-secondary">
                Reservation Fee
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-secondary p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="px-5 py-3 border-b"
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
        >
          <p className="text-[11px] font-semibold text-secondary uppercase mb-1">
            {t("Mali", "Property")}
          </p>
          <p className="text-sm font-semibold text-primary line-clamp-2">
            {deal.listingTitle}
          </p>
          <p className="text-xs text-secondary mt-0.5">
            {deal.location || ""}
          </p>
          <p className="text-xs text-secondary mt-1">
            {t("Bei Mliyokubaliana:", "Agreed Price:")}{" "}
            <span className="font-semibold" style={{ color: COLORS.rust }}>
              {formatTZS(deal.currentOffer || deal.askingPrice)}
            </span>
          </p>
        </div>

        <div className="px-5 py-4">
          {isFeeDisabled && (
            <p
              className="text-xs text-center rounded-lg px-3 py-2 mb-3"
              style={{
                background: "rgba(47,109,79,0.10)",
                color: COLORS.green,
              }}
            >
              {t(
                "Reservation ni BURE kwa sasa.",
                "Reservation is FREE right now."
              )}
            </p>
          )}

          {tiers.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">
              {t(
                "Hakuna tiers za reservation. Wasiliana na Admin.",
                "No reservation tiers available. Contact Admin."
              )}
            </p>
          ) : (
            <>
              <label className="text-xs font-semibold text-secondary block mb-1.5">
                {t(
                  "Chagua muda wa Reservation",
                  "Choose Reservation Duration"
                )}
              </label>
              <select
                value={selectedHours ?? ""}
                onChange={(e) => setSelectedHours(Number(e.target.value))}
                style={{
                  background: COLORS.sand,
                  borderColor: COLORS.sandLine,
                  color: COLORS.night,
                }}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none font-medium mb-3"
              >
                {tiers.map((tier) => {
                  const days =
                    tier.hours % 24 === 0 ? tier.hours / 24 : null;
                  const label = days
                    ? lang === "sw"
                      ? `Siku ${days} (${tier.hours}h)`
                      : `${days} ${days === 1 ? "Day" : "Days"} (${tier.hours}h)`
                    : lang === "sw"
                      ? `Saa ${tier.hours}`
                      : `${tier.hours} hrs`;
                  const feeLabel = isFeeDisabled
                    ? lang === "sw"
                      ? "BURE"
                      : "FREE"
                    : formatTZS(tier.fee);
                  return (
                    <option key={tier.id} value={tier.hours}>
                      {label} — {feeLabel}
                    </option>
                  );
                })}
              </select>

              {selectedTier && (
                <div
                  className="rounded-xl border p-3 mb-3 text-center"
                  style={{
                    borderColor: COLORS.sandLine,
                    background: "rgba(47,109,79,0.06)",
                  }}
                >
                  <p className="text-xs text-secondary">
                    {formatHours(hours, lang)}
                  </p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: COLORS.green }}
                  >
                    {isFeeDisabled
                      ? lang === "sw"
                        ? "BURE"
                        : "FREE"
                      : formatTZS(fee)}
                  </p>
                </div>
              )}

              {hasCredit && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setPaymentMode("flat")}
                    className="flex-1 text-xs font-semibold px-3 py-2 rounded-full border"
                    style={{
                      background:
                        paymentMode === "flat" ? COLORS.night : "white",
                      color:
                        paymentMode === "flat" ? COLORS.sand : COLORS.night,
                      borderColor:
                        paymentMode === "flat"
                          ? COLORS.night
                          : COLORS.sandLine,
                    }}
                  >
                    {t("Lipa Fedha", "Pay Cash")}
                  </button>
                  <button
                    onClick={() => setPaymentMode("credit")}
                    className="flex-1 text-xs font-semibold px-3 py-2 rounded-full border"
                    style={{
                      background:
                        paymentMode === "credit" ? COLORS.green : "white",
                      color:
                        paymentMode === "credit" ? "white" : COLORS.night,
                      borderColor:
                        paymentMode === "credit"
                          ? COLORS.green
                          : COLORS.sandLine,
                    }}
                  >
                    {t(
                      `Tumia Credit (${reservationCreditRemaining})`,
                      `Use Credit (${reservationCreditRemaining})`
                    )}
                  </button>
                </div>
              )}

              {paymentMode === "flat" && !isFeeDisabled && (
                <>
                  <label className="text-xs font-semibold text-secondary block mb-1.5">
                    {t("Njia ya Malipo", "Payment Method")}
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMethod(m)}
                        style={{
                          borderColor:
                            method === m ? COLORS.green : COLORS.sandLine,
                          background:
                            method === m
                              ? "rgba(47,109,79,0.08)"
                              : "white",
                          color: COLORS.night,
                        }}
                        className="rounded-lg border px-2.5 py-2 text-xs font-medium text-center"
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {isMobileMoneyMethod(method) && (
                    <div className="mb-3">
                      <label className="text-xs font-semibold text-secondary block mb-1">
                        {t(
                          `Namba ya Simu ya ${method}`,
                          `${method} Phone Number`
                        )}
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) =>
                          setPhone(cleanPhoneInput(e.target.value))
                        }
                        placeholder={t(
                          "mfano 0712345678",
                          "e.g. 0712345678"
                        )}
                        style={{
                          background: COLORS.sand,
                          borderColor: COLORS.sandLine,
                          color: COLORS.night,
                        }}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none text-center font-mono"
                      />
                    </div>
                  )}

                  {isBankMethod(method) && (
                    <div className="mb-3">
                      <label className="text-xs font-semibold text-secondary block mb-1">
                        {t("Namba ya Kadi", "Card Number")}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardNumber}
                        onChange={(e) =>
                          setCardNumber(cleanCardInput(e.target.value))
                        }
                        placeholder="4000 1234 5678 9010"
                        style={{
                          background: COLORS.sand,
                          borderColor: COLORS.sandLine,
                          color: COLORS.night,
                        }}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none text-center font-mono"
                      />
                    </div>
                  )}
                </>
              )}

              {error && (
                <p
                  style={{ color: COLORS.rust }}
                  className="text-xs text-center mb-2"
                >
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        <div
          className="px-5 py-3 border-t flex gap-2"
          style={{ borderColor: COLORS.sandLine }}
        >
          <button
            onClick={onClose}
            disabled={paying}
            className="flex-1 py-2.5 border rounded-lg text-sm font-semibold text-secondary disabled:opacity-50"
            style={{ borderColor: COLORS.sandLine }}
          >
            {t("Ghairi", "Cancel")}
          </button>
          <button
            onClick={handlePay}
            disabled={!validSelection || paying || tiers.length === 0}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: COLORS.green }}
          >
            {paying ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                {t("Inathibitisha...", "Processing...")}
              </span>
            ) : paymentMode === "credit" || isFeeDisabled ? (
              paymentMode === "credit"
                ? t("Tumia Credit", "Use Credit")
                : t("Weka Reservation", "Place Reservation")
            ) : (
              t(`Lipa ${formatTZS(fee)}`, `Pay ${formatTZS(fee)}`)
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RESERVATION SUCCESS MODAL
// ============================================================
function ReservationSuccessModal({ open, onClose, onContinueDeal, onGoToReservations, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: COLORS.green }}
        >
          <Check color="white" size={32} />
        </div>
        <h3 className="text-lg font-bold text-primary mb-2">
          {t("Reservation Yamekamilika!", "Reservation Complete!")}
        </h3>
        <p className="text-sm text-secondary mb-5 leading-relaxed">
          {t(
            "Mali imehifadhiwa kwa ajili yako. Muuzaji hawezi kuuza kwa mtu mwingine hadi muda uishe. Unaweza kuendelea na mazungumzo au uangalie My Reservations.",
            "The property is held for you. The seller can't sell to someone else until the time ends. You can continue chatting or check My Reservations."
          )}
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onContinueDeal}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-colors hover:opacity-90"
            style={{ background: COLORS.gold, color: COLORS.night }}
          >
            {t("Endelea na Deal Room", "Continue to Deal Room")}
          </button>
          <button
            onClick={onGoToReservations}
            className="w-full py-3 rounded-xl font-semibold text-sm border transition-colors hover:bg-gray-50"
            style={{
              borderColor: COLORS.sandLine,
              color: COLORS.night,
              background: "white",
            }}
          >
            {t("Nenda kwenye My Reservations", "Go to My Reservations")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DEAL LIST ITEM
// ============================================================
function DealListItem({ deal, active, onSelect, lang }) {
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
      className="w-full flex items-start gap-3 p-3 rounded-xl border text-left"
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

// ============================================================
// OFFER BUBBLE
// ============================================================
function OfferBubble({ amount, mine, lang }) {
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

// ============================================================
// DEAL DETAIL
// ============================================================
function DealDetail({
  deal,
  side,
  onBack,
  onSendMessage,
  onRetryMessage,
  onSendOffer,
  onRespond,
  onReopen,
  onReserveConfirm,
  onInspectionResolve,
  onProofSubmit,
  onProofConfirm,
  onProofReject,
  lang,
  user,
  onShowSuccess,
}) {
  const [text, setText] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [freeReserving, setFreeReserving] = useState(false);
  const [chatError, setChatError] = useState("");

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("FRAUD");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [contactDrawerOpen, setContactDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [reopenInfo, setReopenInfo] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const category = getCategory(deal.category);
  const CategoryIcon = getCategoryIcon(category?.iconKey);
  const status =
    getDealStatus(lang)[deal.status] ||
    FALLBACK_DEAL_STATUS(lang, deal.status);
  const counterpartyLabel =
    side === "seller"
      ? lang === "sw"
        ? "Mnunuzi"
        : "Buyer"
      : lang === "sw"
        ? "Muuzaji"
        : "Seller";

  const isBuyer = side === "buyer";
  const isSeller = side === "seller";

  // ── MPYA: hali ya lock/cancel ──
  // Deal iliyoghairiwa haionyeshwi kama "imesimamishwa" (flag inaweza kubaki)
  const isLocked = !!deal.adminLocked && deal.status !== "cancelled";
  const isCancelledByAdmin = !!deal.cancelledByAdmin;
  const canInteract = !isLocked && deal.status !== "cancelled";

  const lastOffer = [...(deal.messages || [])]
    .reverse()
    .find(
      (m) =>
        m.offerAmount &&
        !["declined", "rejected", "cancelled"].includes(
          String(m.status || "").toLowerCase()
        )
    );
  const iMadeLastOffer = lastOffer?.sender === "me";

  // ── Notice ya "mmekubaliana" — inakaa ndani ya timeline, chini ya ofa
  //    iliyokubaliwa, ili ujumbe mpya ufuate chini yake (si juu yake) ──
  const showAcceptedNotice =
    deal.status === "accepted" &&
    !isLocked &&
    (isSeller ||
      (isBuyer && !deal.reservationPaidAt && !deal.transactionId));
  const acceptedAnchorId = lastOffer?.id ?? null;
  const acceptedAnchorExists =
    acceptedAnchorId != null &&
    (deal.messages || []).some(
      (m) => String(m.id) === String(acceptedAnchorId)
    );

  const acceptedNotice = showAcceptedNotice ? (
    <div key="accepted-notice" className="flex justify-center my-1">
      <div
        style={{
          background: isSeller
            ? "rgba(232,163,61,0.14)"
            : "rgba(47,109,79,0.08)",
          color: isSeller ? "#8A5A16" : COLORS.green,
          borderColor: COLORS.sandLine,
        }}
        className="border rounded-xl px-3.5 py-2 max-w-[90%] text-body-sm text-center font-medium"
      >
        {isSeller
          ? lang === "sw"
            ? `Mmekubaliana kwenye ${formatTZS(
                deal.currentOffer
              )}. Mnunuzi ataendelea na hatua inayofuata.`
            : `You agreed at ${formatTZS(
                deal.currentOffer
              )}. The buyer will proceed with the next step.`
          : lang === "sw"
            ? `Mmekubaliana bei ya ${formatTZS(
                deal.currentOffer
              )}. Endelea kuwasiliana na muuzaji hapa.`
            : `You've agreed at ${formatTZS(
                deal.currentOffer
              )}. Continue chatting with the seller here.`}
      </div>
    </div>
  ) : null;
  const canRespond =
    canInteract &&
    deal.currentOffer > 0 &&
    !!lastOffer &&
    !iMadeLastOffer;

  const waitingText = iMadeLastOffer
    ? lang === "sw"
      ? `Ofa yako ya ${formatTZS(
          deal.currentOffer
        )} imetumwa — unasubiri upande wa pili ukubali au ukatae.`
      : `Your offer of ${formatTZS(
          deal.currentOffer
        )} was sent — waiting for the other party to accept or decline.`
    : deal.currentOffer > 0
      ? lang === "sw"
        ? `Ofa ya ${formatTZS(
            deal.currentOffer
          )} imepokelewa — unaweza kukubali au kukataa.`
        : `Offer of ${formatTZS(
            deal.currentOffer
          )} received — you can accept or decline.`
      : lang === "sw"
        ? "Hakuna ofa bado — toa ofa yako ya kwanza."
        : "No offer yet — make your first offer.";

  const sellerPhone =
    deal.sellerPhone ??
    deal.seller_phone ??
    deal.counterpartyPhone ??
    null;
  const sellerEmail =
    deal.sellerEmail ??
    deal.seller_email ??
    deal.counterpartyEmail ??
    null;
  const buyerPhone = deal.buyerPhone ?? null;
  const buyerEmail = deal.buyerEmail ?? null;

  const reservationPaidStatuses = [
    "reserved",
    "awaiting_final_payment",
    "payment_proof_submitted",
    "completed",
  ];
  const reservationPaid = reservationPaidStatuses.includes(deal.status);

  // Fee ikizimwa, reservation inabaki kama hatua ya BURE (bila malipo,
  // bila kuchagua tier) ili mtiririko wa deal usikwame.
  // (`!== false` ili settings zikichelewa kupakia zisibadilishe bango.)
  const reservationSettings = useReservationSettings();
  const reservationTiers = useActiveReservationTiers();
  const reservationEnabled = reservationSettings?.is_enabled !== false;
  // Muda wa reservation ya bure: tier ya kwanza ikiwepo, vinginevyo masaa 48
  // (sawa na DEFAULT_RESERVATION_HOURS ya backend — hakuna tier hai).
  const FREE_RESERVATION_FALLBACK_HOURS = 48;

  const canReserve =
    canInteract &&
    isBuyer &&
    ["negotiating", "offer_sent", "accepted"].includes(deal.status) &&
    !deal.pendingPayment &&
    !deal.reservationPaidAt;

  const showReservedBanner = isBuyer && reservationPaid;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setChatError("");
    onSendMessage(deal.id, trimmed);
    setText("");
  };

  const handleExit = () => {
    setMenuOpen(false);
    const params = new URLSearchParams(window.location.search);
    const enteredViaLink = params.has("deal") || params.has("listing");
    const isMobileView =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 767px)").matches;
    const idx = window.history.state?.idx;
    const hasHistory =
      typeof idx === "number" ? idx > 0 : window.history.length > 1;
    if (isMobileView && !enteredViaLink) onBack();
    else if (hasHistory) navigate(-1);
    else onBack();
  };

  const handleReopenClick = async () => {
    if (!onReopen || reopening) return;
    setReopening(true);
    setReopenInfo(null);
    const res = await onReopen(deal.id);
    if (!res?.ok) {
      setReopenInfo(
        explainApiError(res?.error, {
          lang,
          action: "reopen_deal",
          fallback:
            lang === "sw"
              ? "Imeshindwa kufufua mazungumzo."
              : "Could not reopen the conversation.",
        })
      );
    }
    setReopening(false);
  };

  const handleOffer = () => {
    const value = parseInt(cleanMoneyInput(offerAmount), 10);
    if (!value) return;
    onSendOffer(deal.id, value);
    setOfferAmount("");
    setOfferOpen(false);
  };

  const handleReserveSuccess = async (details) => {
    setReserveModalOpen(false);
    const result = await onReserveConfirm(deal.id, details);
    if (result?.ok) {
      onShowSuccess?.();
    }
  };

  // Reservation ya BURE (fee imezimwa) — bila modal, bila malipo
  const handleFreeReserve = async () => {
    if (freeReserving) return;
    setFreeReserving(true);
    try {
      await handleReserveSuccess({
        hours:
          reservationTiers?.[0]?.hours ?? FREE_RESERVATION_FALLBACK_HOURS,
        fee: 0,
        method: "free",
        phone: null,
        cardNumber: null,
      });
    } finally {
      setFreeReserving(false);
    }
  };

  const handleReportSubmit = async () => {
    if (reportDetails.trim().length < 10) return;
    setReportBusy(true);
    try {
      const reportedUserId =
        side === "buyer" ? deal.sellerId : deal.buyerId;
      let dealRoomId = deal.dealRoomId;
      if (!dealRoomId) {
        try {
          const detailRes = await dealsApi.detail(deal.id);
          dealRoomId =
            detailRes?.id ?? detailRes?.deal_room_id ?? deal.id;
        } catch {
          dealRoomId = deal.id;
        }
      }
      await dealsApi.report(dealRoomId, {
        reported_user_id: reportedUserId,
        reason: reportReason,
        details: reportDetails.trim(),
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportOpen(false);
        setReportSuccess(false);
        setReportDetails("");
        setReportReason("FRAUD");
      }, 3500);
    } catch (err) {
      alert(
        err?.message ||
          (lang === "sw"
            ? "Imeshindwa kutuma ripoti. Jaribu tena."
            : "Failed to send report. Try again.")
      );
    } finally {
      setReportBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="flex items-center gap-3 border-b p-3 sm:p-4"
      >
        <button onClick={onBack} className="md:hidden shrink-0" aria-label="Back">
          <ArrowLeft size={18} color={COLORS.night} />
        </button>
        <div
          style={{ background: COLORS.night }}
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        >
          {CategoryIcon && <CategoryIcon size={15} color={COLORS.gold} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-primary text-sm font-semibold truncate">
            {deal.counterpartyName}{" "}
            <span className="text-muted font-normal">· {counterpartyLabel}</span>
          </p>
          {deal.listingId ? (
            <Link
              to={`/mali/${deal.listingId}`}
              className="text-secondary text-body-sm truncate flex items-center gap-1 hover:text-[#FEA406] transition-colors"
            >
              <MapPin size={10} /> {deal.listingTitle}
            </Link>
          ) : (
            <p className="text-secondary text-body-sm truncate flex items-center gap-1">
              <MapPin size={10} /> {deal.listingTitle}
            </p>
          )}
        </div>
        <span
          style={{
            background: status?.bg || "#F5F3EC",
            color: status?.fg || "#101A2E",
          }}
          className="text-body-sm font-semibold px-2.5 py-1 rounded-full shrink-0"
        >
          {status?.label || deal.status || "—"}
        </span>

        <button
          onClick={() => setReportOpen(true)}
          style={{ color: COLORS.rust }}
          className="shrink-0 p-1.5 rounded-full hover:bg-red-50 transition-colors"
          title={
            side === "buyer"
              ? lang === "sw"
                ? "Ripoti Muuzaji"
                : "Report Seller"
              : lang === "sw"
                ? "Ripoti Mnunuzi"
                : "Report Buyer"
          }
        >
          <Flag size={15} />
        </button>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{ color: COLORS.night }}
            className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
            aria-label={lang === "sw" ? "Menyu" : "Menu"}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              style={{
                background: "white",
                borderColor: COLORS.sandLine,
                boxShadow: "0 12px 32px rgba(16,26,46,0.18)",
              }}
              className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border py-1.5"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setContactDrawerOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-black/5"
                style={{ color: COLORS.night }}
              >
                <UserRound size={15} />
                {isBuyer
                  ? lang === "sw"
                    ? "Profile ya Muuzaji"
                    : "Seller's Profile"
                  : lang === "sw"
                    ? "Profile ya Mnunuzi"
                    : "Buyer's Profile"}
              </button>

              {isBuyer && deal.status === "reserved" && !isLocked && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onInspectionResolve(
                      deal.id,
                      "READY_FOR_FINAL_PAYMENT",
                      ""
                    );
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-black/5"
                  style={{ color: COLORS.green }}
                >
                  <CheckCircle2 size={15} />
                  {lang === "sw"
                    ? "Nimeridhika — Kamilisha Deal"
                    : "I'm satisfied — Finalize Deal"}
                </button>
              )}

              <div
                style={{ borderColor: COLORS.sandLine }}
                className="my-1 border-t"
              />

              <button
                role="menuitem"
                onClick={handleExit}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-black/5"
                style={{ color: COLORS.rust }}
              >
                <LogOut size={15} />
                {lang === "sw" ? "Toka kwenye Deal Room" : "Exit this deal room"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Price strip */}
      <div
        style={{ background: COLORS.sandLine }}
        className="flex items-center justify-between px-4 py-2 text-body-sm"
      >
        <span className="text-secondary">
          {lang === "sw" ? "Bei Iliyowekwa" : "Asking Price"}:{" "}
          {formatTZS(deal.askingPrice)}
        </span>
        <span style={{ color: COLORS.rust }} className="font-semibold">
          {lang === "sw" ? "Ofa ya Sasa" : "Current Offer"}:{" "}
          {formatTZS(deal.currentOffer)}
        </span>
      </div>

      {/* ── MPYA: Lock banner (juu kabisa, inaonekana kwa pande zote) ── */}
      {isLocked && (
        <div
          className="border-b px-3 sm:px-4 py-3 flex items-start gap-3"
          style={{
            background:
              "linear-gradient(135deg, rgba(232,163,61,0.18) 0%, rgba(232,163,61,0.08) 100%)",
            borderColor: "rgba(232,163,61,0.4)",
          }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#8A5A16" }}
          >
            <Lock size={16} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "#8A5A16" }}>
              {lang === "sw"
                ? "Room Imesimamishwa na Msimamizi"
                : "Room Suspended by Admin"}
            </p>
            <p className="text-xs text-secondary mt-0.5 leading-relaxed">
              {deal.lockedReason
                ? lang === "sw"
                  ? `Sababu: ${deal.lockedReason}`
                  : `Reason: ${deal.lockedReason}`
                : lang === "sw"
                  ? "Ujumbe na ofa hazipokelewi hadi ukaguzi ukamilike."
                  : "Messages and offers are paused until review is complete."}
            </p>
            {deal.lockedByName && (
              <p className="text-[11px] text-muted mt-0.5">
                {lang === "sw" ? "Na" : "By"}: {deal.lockedByName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 🛠️ RESERVE BANNER — wazi kwa buyer, canReserve */}
      {isBuyer && canReserve && !reserveModalOpen && (
        <div
          className="border-b px-3 sm:px-4 py-3 flex items-center gap-3"
          style={{
            background:
              "linear-gradient(135deg, rgba(47,109,79,0.12) 0%, rgba(37,107,68,0.08) 100%)",
            borderColor: "rgba(47,109,79,0.25)",
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: COLORS.green }}
          >
            <ShieldCheck size={18} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold"
              style={{ color: COLORS.green }}
            >
              {lang === "sw"
                ? "Hifadhi Mali Hii"
                : "Reserve This Property"}
            </p>
            <p className="text-xs text-secondary mt-0.5">
              {reservationEnabled
                ? lang === "sw"
                  ? "Lipia Reservation Fee ili muuzaji asiiuze kwa mtu mwingine."
                  : "Pay the Reservation Fee so the seller can't sell to someone else."
                : lang === "sw"
                  ? "Reservation ni BURE kwa sasa — hifadhi mali ili muuzaji asiiuze kwa mtu mwingine."
                  : "Reservation is FREE right now — hold the property so the seller can't sell to someone else."}
            </p>
          </div>
          <button
            onClick={
              reservationEnabled
                ? () => setReserveModalOpen(true)
                : handleFreeReserve
            }
            disabled={freeReserving}
            style={{ background: COLORS.green, color: "white" }}
            className="shrink-0 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {freeReserving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : reservationEnabled ? (
              <CreditCard size={13} />
            ) : (
              <ShieldCheck size={13} />
            )}
            {reservationEnabled
              ? lang === "sw"
                ? "Reserve Sasa"
                : "Reserve Now"
              : lang === "sw"
                ? "Hifadhi Bure"
                : "Reserve Free"}
          </button>
        </div>
      )}

      {/* 🛠️ PROPERTY RESERVED BANNER */}
      {showReservedBanner && deal.status === "reserved" && (
        <div
          className="border-b px-3 sm:px-4 py-3 flex items-center gap-3"
          style={{
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(30,58,138,0.08) 100%)",
            borderColor: "rgba(37,99,235,0.25)",
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#2563EB" }}
          >
            <ShieldCheck size={18} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "#1E3A8A" }}>
              {lang === "sw"
                ? "Mali Imehifadhiwa kwa Ajili Yako"
                : "Property Reserved for You"}
            </p>
            <p className="text-xs text-secondary mt-0.5">
              {lang === "sw"
                ? `Inaisha ${new Date(
                    deal.reservationExpiresAt || Date.now() + 24 * 3600000
                  ).toLocaleString("sw-TZ")}`
                : `Ends ${new Date(
                    deal.reservationExpiresAt || Date.now() + 24 * 3600000
                  ).toLocaleString("en-US")}`}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/buyer/reservations")}
            style={{ background: "#2563EB", color: "white" }}
            className="shrink-0 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <ArrowRight size={13} />
            {lang === "sw" ? "Ona Reservations" : "View Reservations"}
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-2.5"
        style={{ background: COLORS.sand }}
      >
        {deal.messages.map((m, idx) => {
          const text = getMessageText(m, lang);
          const prevMsg = idx > 0 ? deal.messages[idx - 1] : null;
          const showDaySeparator =
            !!m.at && (!prevMsg || !isSameDay(prevMsg.at, m.at));
          const mine = m.sender === "me";
          // ── MPYA: admin bubble — chunguza `kind` pia ──
          const isAdminMessage =
            m.sender === "admin" || m.kind === "ADMIN";
          const bubble = isAdminMessage ? (
            <div key={m.id} className="flex justify-center my-1">
              <div
                style={{
                  background: "rgba(16,26,46,0.06)",
                  color: COLORS.night,
                  borderColor: COLORS.sandLine,
                }}
                className="border rounded-xl px-3.5 py-2 max-w-[90%] text-body-sm text-center font-medium"
              >
                <span style={{ color: COLORS.rust }} className="font-bold">
                  SokoMkononi Admin:{" "}
                </span>
                {text}
              </div>
            </div>
          ) : (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex flex-col max-w-[75%] ${
                  mine ? "items-end" : "items-start"
                }`}
              >
                {m.offerAmount ? (
                  <OfferBubble
                    amount={m.offerAmount}
                    mine={mine}
                    lang={lang}
                  />
                ) : (
                  <div
                    style={{
                      background: mine ? COLORS.night : "white",
                      color: mine ? COLORS.sand : COLORS.night,
                      borderColor: COLORS.sandLine,
                      opacity: m.sendStatus === "sending" ? 0.7 : 1,
                    }}
                    className="border rounded-2xl px-4 py-2.5 text-sm break-words"
                  >
                    {text}
                  </div>
                )}
                <MessageMeta
                  m={m}
                  mine={mine}
                  lang={lang}
                  onRetry={(msgId) => onRetryMessage?.(deal.id, msgId)}
                />
              </div>
            </div>
          );
          return (
            <React.Fragment key={m.id}>
              {showDaySeparator && (
                <div className="flex justify-center my-1">
                  <span
                    style={{
                      background: "rgba(16,26,46,0.06)",
                      color: "rgba(16,26,46,0.55)",
                    }}
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  >
                    {formatDayLabel(m.at, lang)}
                  </span>
                </div>
              )}
              {bubble}
              {acceptedAnchorExists &&
                String(m.id) === String(acceptedAnchorId) &&
                acceptedNotice}
            </React.Fragment>
          );
        })}

        {/* Fallback: ofa iliyokubaliwa haipo kwenye orodha — weka mwishoni */}
        {!acceptedAnchorExists && acceptedNotice}
      </div>

      {/* Negotiation actions */}
      {(deal.status === "negotiating" || deal.status === "offer_sent") &&
        !isLocked && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-t flex-wrap"
        >
          {canRespond ? (
            <>
              <button
                onClick={() => onRespond(deal.id, "accepted")}
                style={{ background: COLORS.green, color: "white" }}
                className="flex items-center gap-1.5 text-body-sm font-semibold px-3 py-2 rounded-lg"
              >
                <Check size={13} />{" "}
                {lang === "sw"
                  ? `Kubali Ofa ya ${formatTZS(deal.currentOffer)}`
                  : `Accept Offer of ${formatTZS(deal.currentOffer)}`}
              </button>
              <button
                onClick={() => onRespond(deal.id, "declined")}
                style={{
                  borderColor: "rgba(193,80,46,0.35)",
                  color: COLORS.rust,
                }}
                className="flex items-center gap-1.5 text-body-sm font-semibold px-3 py-2 rounded-lg border"
              >
                <X size={13} /> {lang === "sw" ? "Kataa" : "Decline"}
              </button>
            </>
          ) : (
            <span
              style={{ color: "var(--text-muted)" }}
              className="text-body-sm italic flex-1"
            >
              {waitingText}
            </span>
          )}
          {(isBuyer || isSeller) && (
            <button
              onClick={() => setOfferOpen((v) => !v)}
              style={{
                borderColor: COLORS.sandLine,
                color: COLORS.night,
              }}
              className="flex items-center gap-1.5 text-body-sm font-semibold px-3 py-2 rounded-lg border ml-auto"
            >
              <HandCoins size={13} />{" "}
              {deal.currentOffer > 0
                ? lang === "sw"
                  ? "Toa Ofa Nyingine"
                  : "Make Another Offer"
                : lang === "sw"
                  ? "Toa Ofa"
                  : "Make an Offer"}
              <ChevronDown
                size={12}
                style={{
                  transform: offerOpen ? "rotate(180deg)" : "none",
                }}
              />
            </button>
          )}
        </div>
      )}

      {/* Offer input */}
      {(isBuyer || isSeller) && offerOpen && !isLocked && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-t"
        >
          <input
            style={{
              background: COLORS.sand,
              borderColor: COLORS.sandLine,
              color: COLORS.night,
            }}
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none text-center"
            placeholder={
              lang === "sw"
                ? "Kiasi cha ofa (TZS)"
                : "Offer amount (TZS)"
            }
            type="text"
            inputMode="numeric"
            value={formatMoneyInput(offerAmount)}
            onChange={(e) =>
              setOfferAmount(cleanMoneyInput(e.target.value))
            }
          />
          <button
            onClick={handleOffer}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="text-body-sm font-semibold px-3 py-2 rounded-lg shrink-0"
          >
            {lang === "sw" ? "Tuma Ofa" : "Send Offer"}
          </button>
        </div>
      )}

      {deal.status === "reserved" && side === "seller" && !isLocked && (
        <div
          style={{
            borderColor: COLORS.sandLine,
            background: "rgba(16,26,46,0.04)",
          }}
          className="flex flex-col items-center text-center gap-2 px-3 sm:px-4 py-3 border-t text-body-sm"
        >
          <span className="text-primary max-w-md">
            {lang === "sw"
              ? `Reservation Fee ${formatTZS(
                  deal.reservationFee
                )} imelipwa · ${
                  deal.reservationMethod
                } · Mnunuzi yuko kwenye Inspection Period.`
              : `Reservation Fee ${formatTZS(
                  deal.reservationFee
                )} paid · ${
                  deal.reservationMethod
                } · Buyer is in Inspection Period.`}
          </span>
          {deal.reservationExpiresAt && (
            <span
              style={{ color: COLORS.rust }}
              className="font-semibold"
            >
              {lang === "sw" ? "Inaisha" : "Ends"}:{" "}
              {new Date(deal.reservationExpiresAt).toLocaleString(
                lang === "sw" ? "sw-TZ" : "en-US"
              )}
            </span>
          )}
        </div>
      )}

      {deal.status === "reserved" && side === "buyer" && !isLocked && (
        <div
          style={{
            borderColor: COLORS.sandLine,
            background: "rgba(47,109,79,0.08)",
          }}
          className="flex flex-col items-center text-center gap-2 px-3 sm:px-4 py-3 border-t"
        >
          <ShieldCheck size={16} color={COLORS.green} />
          <span
            style={{ color: COLORS.green }}
            className="text-body-sm font-medium max-w-md"
          >
            {lang === "sw"
              ? `Mali imeshikiliwa kwa ajili yako${
                  deal.reservationExpiresAt
                    ? ` hadi ${new Date(
                        deal.reservationExpiresAt
                      ).toLocaleString("sw-TZ")}`
                    : ""
                }. Ukisharidhika, unaweza kuendelea na malipo ya mwisho.`
              : `This item is held for you${
                  deal.reservationExpiresAt
                    ? ` until ${new Date(
                        deal.reservationExpiresAt
                      ).toLocaleString("en-US")}`
                    : ""
                }. When satisfied, you can proceed to final payment.`}
          </span>
          <button
            onClick={() =>
              onInspectionResolve(
                deal.id,
                "READY_FOR_FINAL_PAYMENT",
                ""
              )
            }
            style={{
              borderColor: COLORS.green,
              color: COLORS.green,
              background: "transparent",
            }}
            className="text-body-sm font-semibold px-3 py-1.5 rounded-lg border"
          >
            {lang === "sw" ? "Nimeridhika — Endelea" : "I'm satisfied — Continue"}
          </button>
        </div>
      )}

      {deal.status === "awaiting_final_payment" && side === "buyer" && !isLocked && (
        <PaymentProofPanel
          deal={deal}
          lang={lang}
          onSubmit={(proof) => onProofSubmit(deal.id, proof)}
        />
      )}

      {deal.status === "awaiting_final_payment" && side === "seller" && !isLocked && (
        <div
          style={{
            borderColor: COLORS.sandLine,
            background: "rgba(37,99,235,0.08)",
          }}
          className="flex flex-col items-center text-center gap-2 px-3 sm:px-4 py-3 border-t"
        >
          <CheckCircle2 size={16} color="#2563EB" />
          <span
            style={{ color: "#1E3A8A" }}
            className="text-body-sm font-medium max-w-md"
          >
            {lang === "sw"
              ? `Ukaguzi umepita. Mnunuzi anaandaa malipo ya mwisho ya ${formatTZS(
                  deal.currentOffer
                )} na atapakia uthibitisho hapa.`
              : `Inspection passed. Buyer is preparing the final payment of ${formatTZS(
                  deal.currentOffer
                )} and will upload proof here.`}
          </span>
        </div>
      )}

      {deal.status === "payment_proof_submitted" && side === "seller" && !isLocked && (
        <PaymentProofReview
          deal={deal}
          lang={lang}
          onConfirm={() => onProofConfirm(deal.id)}
          onReject={(reason) => onProofReject(deal.id, reason)}
        />
      )}

      {deal.status === "payment_proof_submitted" && side === "buyer" && !isLocked && (
        <div
          style={{
            borderColor: COLORS.sandLine,
            background: "rgba(232,163,61,0.1)",
          }}
          className="flex flex-col items-center text-center gap-2 px-3 sm:px-4 py-3 border-t"
        >
          <FileImage size={16} color="#8A5A16" />
          <span
            style={{ color: "#8A5A16" }}
            className="text-body-sm font-medium max-w-md"
          >
            {lang === "sw"
              ? `Uthibitisho wako wa malipo umetumwa. Unasubiri muuzaji athibitishe "Nimepokea Malipo".`
              : `Your payment proof has been submitted. Waiting for the seller to confirm "Payment Received".`}
          </span>
        </div>
      )}

      {deal.status === "completed" && (
        <div
          style={{
            borderColor: COLORS.sandLine,
            background: "rgba(47,109,79,0.1)",
          }}
          className="flex flex-col items-center text-center gap-2 px-3 sm:px-4 py-3 border-t"
        >
          <PartyPopper size={16} color={COLORS.green} />
          <span
            style={{ color: COLORS.green }}
            className="text-body-sm font-medium max-w-md"
          >
            {lang === "sw"
              ? "Muamala umekamilika! Malipo yamethibitishwa — angalia My Transactions kwa risiti."
              : "Transaction completed! Payment confirmed — check My Transactions for the receipt."}
          </span>
          {isSeller && deal.listingId && (
            <Link
              to={`/mali/${deal.listingId}`}
              style={{ background: COLORS.green, color: "white" }}
              className="mt-1 flex items-center gap-1.5 text-body-sm font-semibold px-4 py-2 rounded-lg"
            >
              {lang === "sw" ? "Nenda kwenye Tangazo" : "Go to Listing"}{" "}
              <ArrowRight size={13} />
            </Link>
          )}
        </div>
      )}

      {deal.status === "disputed" && (
        <div
          style={{
            borderColor: COLORS.sandLine,
            background: "rgba(193,80,46,0.08)",
          }}
          className="flex flex-col items-center text-center gap-2 px-3 sm:px-4 py-3 border-t"
        >
          <AlertTriangle size={16} color={COLORS.rust} />
          <span
            style={{ color: COLORS.rust }}
            className="text-body-sm font-medium max-w-md"
          >
            {lang === "sw"
              ? `Mgogoro umeripotiwa. Timu ya SokoMkononi itaingilia kati kusaidia kutatua.`
              : `A dispute has been reported. SokoMkononi team will step in to help resolve it.`}
          </span>
        </div>
      )}

      {REVIVABLE_STATUSES.includes(deal.status) && (
        <div
          style={{
            borderColor: COLORS.sandLine,
            background: "rgba(16,26,46,0.04)",
          }}
          className="flex flex-col items-center text-center gap-3 px-3 sm:px-4 py-4 border-t"
        >
          <Ban size={16} color={COLORS.night} />
          <div className="max-w-md space-y-1">
            <p className="text-primary text-body-sm font-medium">
              {deal.status === "cancelled"
                ? lang === "sw"
                  ? "Deal hii imeghairiwa."
                  : "This deal has been cancelled."
                : lang === "sw"
                  ? "Deal hii imefungwa."
                  : "This deal is closed."}
            </p>
            {!isCancelledByAdmin && (
              <p className="text-secondary text-body-sm">
                {lang === "sw"
                  ? "Mazungumzo yenu yote yamehifadhiwa. Mmoja wenu akifufua, mnaendelea kujadiliana kutoka mlipoishia."
                  : "Your whole conversation is saved. If either of you reopens it, you continue from where you left off."}
              </p>
            )}
            {deal.status === "cancelled" && (
              <p className="text-muted text-xs">
                {lang === "sw"
                  ? "Reservation Fee iliyolipwa haitarejeshwa. Ukihitaji kureserve tena, utaanza mchakato huo upya."
                  : "Any Reservation Fee already paid is non-refundable. If you need to reserve again, that step starts over."}
              </p>
            )}
          </div>

          {/* ── MPYA: admin alighairi — onyesha support, ficha "Fufua" ── */}
          {isCancelledByAdmin ? (
            <div
              style={{
                background: "rgba(193,80,46,0.08)",
                color: COLORS.rust,
                borderColor: "rgba(193,80,46,0.35)",
              }}
              className="max-w-md w-full rounded-lg border px-3 py-2.5 text-xs text-center"
            >
              <p className="font-semibold mb-1">
                {lang === "sw"
                  ? "Imeghairiwa na Msimamizi"
                  : "Cancelled by Administrator"}
              </p>
              <p>
                {lang === "sw"
                  ? "Deal hii ilighairiwa na msimamizi na haiwezi kufufuliwa. Wasiliana na support@sokomkononi.co.tz ukihitaji msaada."
                  : "This deal was cancelled by an administrator and cannot be reopened. Contact support@sokomkononi.co.tz if you need help."}
              </p>
            </div>
          ) : (
            <>
              {onReopen &&
                !isLocked &&
                deal.canReopen !== false &&
                deal.can_reopen !== false && (
                  <button
                    type="button"
                    onClick={handleReopenClick}
                    disabled={reopening}
                    className="btn btn-primary btn-sm inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    {reopening ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RotateCcw size={14} />
                    )}
                    {lang === "sw" ? "Fufua mazungumzo" : "Reopen conversation"}
                  </button>
                )}
              {(deal.canReopen === false || deal.can_reopen === false) && (
                <p className="text-muted text-xs max-w-md">
                  {lang === "sw"
                    ? "Deal hii haiwezi kufufuliwa moja kwa moja. Wasiliana na support@sokomkononi.co.tz ukihitaji msaada."
                    : "This deal can't be reopened directly. Contact support@sokomkononi.co.tz if you need help."}
                </p>
              )}
            </>
          )}

          {reopenInfo && (
            <div className="w-full max-w-md">
              <ErrorCallout info={reopenInfo} />
            </div>
          )}
        </div>
      )}

      {chatError && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
            borderColor: COLORS.sandLine,
          }}
          className="border-t px-3 sm:px-4 py-2 text-body-sm font-medium text-center"
        >
          {chatError}
        </div>
      )}

      {/* Composer — kuzimwa kama locked au cancelled */}
      {deal.status !== "declined" &&
        deal.status !== "cancelled" &&
        !isLocked && (
          <div
            style={{ borderColor: COLORS.sandLine, background: "white" }}
            className="flex items-center gap-2 p-3 border-t"
          >
            <input
              style={{
                background: COLORS.sand,
                borderColor: COLORS.sandLine,
                color: COLORS.night,
              }}
              className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none"
              placeholder={
                lang === "sw" ? "Andika ujumbe..." : "Type a message..."
              }
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (chatError) setChatError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        )}

      {/* ── MPYA: badala ya composer kama locked ── */}
      {isLocked && deal.status !== "cancelled" && (
        <div
          style={{
            borderColor: "rgba(232,163,61,0.4)",
            background: "rgba(232,163,61,0.08)",
          }}
          className="border-t px-3 sm:px-4 py-3 flex items-center justify-center gap-2 text-xs font-medium"
        >
          <Lock size={13} color="#8A5A16" />
          <span style={{ color: "#8A5A16" }}>
            {lang === "sw"
              ? "Ujumbe umezimwa — room imesimamishwa na msimamizi."
              : "Messaging is disabled — room is suspended by admin."}
          </span>
        </div>
      )}

      {/* Reservation Modal */}
      <ReservationModal
        open={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
        deal={deal}
        lang={lang}
        user={user}
        onConfirm={handleReserveSuccess}
      />

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            style={{ background: "white", borderColor: COLORS.sandLine }}
            className="rounded-2xl border w-full max-w-md p-5"
          >
            <h3 className="text-primary text-base font-bold mb-3 flex items-center gap-2">
              <Flag size={16} color={COLORS.rust} />
              {side === "buyer"
                ? lang === "sw"
                  ? "Ripoti Muuzaji"
                  : "Report this Seller"
                : lang === "sw"
                  ? "Ripoti Mnunuzi"
                  : "Report this Buyer"}
            </h3>

            {reportSuccess ? (
               <div
                  style={{
                       color: COLORS.green,
                        background: "rgba(47,109,79,0.1)",
                 }}
                className="rounded-lg p-3 text-sm text-center mb-3 space-y-2"
               >
           <p>
           {lang === "sw"
                  ? "Ripoti yako imetumwa. Timu yetu itachukua hatua ndani ya saa 24."
                  : "Your report has been sent. Our team will act within 24 hours."}
            </p>
               <a
                href="/dashboard/safety"
                className="inline-block text-xs font-semibold underline"
                >
              {lang === "sw"
               ? "Fuatilia kwenye Usalama & Msaada →"
               : "Track in Safety & Support →"}
               </a>
          </div>
            ) : (
              <>
                <label className="text-xs font-semibold text-secondary">
                  {lang === "sw" ? "Sababu" : "Reason"}
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-3 mt-1"
                  style={{ borderColor: COLORS.sandLine }}
                >
                  <option value="FRAUD">
                    {lang === "sw"
                      ? "Utapeli / Uongo"
                      : "Fraud / Dishonesty"}
                  </option>
                  <option value="HARASSMENT">
                    {lang === "sw"
                      ? "Unyanyasaji / Vitisho"
                      : "Harassment / Threats"}
                  </option>
                  <option value="NO_SHOW">
                    {lang === "sw"
                      ? "Hakufika kwenye Ukaguzi"
                      : "No-show at inspection"}
                  </option>
                  <option value="FAKE_DOCS">
                    {lang === "sw"
                      ? "Hati za Uongo"
                      : "Fake documents"}
                  </option>
                  <option value="OFF_PLATFORM">
                    {lang === "sw"
                      ? "Kutaka Malipo Nje ya Jukwaa"
                      : "Off-platform payment request"}
                  </option>
                  <option value="OTHER">
                    {lang === "sw" ? "Nyingine" : "Other"}
                  </option>
                </select>

                <label className="text-xs font-semibold text-secondary">
                  {lang === "sw" ? "Maelezo" : "Details"}
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={4}
                  placeholder={
                    lang === "sw"
                      ? "Eleza kwa ufupi tatizo (angalau herufi 10)..."
                      : "Describe the issue briefly (at least 10 chars)..."
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-3 mt-1 resize-none"
                  style={{ borderColor: COLORS.sandLine }}
                />

                {reportDetails.trim().length > 0 &&
                  reportDetails.trim().length < 10 && (
                    <p
                      className="text-xs mb-2"
                      style={{ color: COLORS.rust }}
                    >
                      {lang === "sw"
                        ? "Tafadhali toa maelezo ya kutosha (angalau herufi 10)."
                        : "Please provide enough details (at least 10 chars)."}
                    </p>
                  )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setReportOpen(false);
                      setReportDetails("");
                      setReportReason("FRAUD");
                    }}
                    disabled={reportBusy}
                    style={{ borderColor: COLORS.sandLine }}
                    className="flex-1 border text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    {lang === "sw" ? "Ghairi" : "Cancel"}
                  </button>
                  <button
                    onClick={handleReportSubmit}
                    disabled={
                      reportDetails.trim().length < 10 || reportBusy
                    }
                    style={{
                      background:
                        reportDetails.trim().length >= 10
                          ? COLORS.rust
                          : COLORS.sandLine,
                      color: "white",
                    }}
                    className="flex-1 text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reportBusy
                      ? lang === "sw"
                        ? "Inatuma..."
                        : "Sending..."
                      : lang === "sw"
                        ? "Tuma Ripoti"
                        : "Send Report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ContactDrawer
        open={contactDrawerOpen}
        onClose={() => setContactDrawerOpen(false)}
        lang={lang}
        dealId={deal.dealRoomId || deal.id}
        currentUserId={user?.id}
        contact={{
          name: deal.counterpartyName,
          phone: isBuyer ? sellerPhone : buyerPhone,
          email: isBuyer ? sellerEmail : buyerEmail,
          role: isBuyer ? "seller" : "buyer",
          userId: isBuyer ? deal.sellerId : deal.buyerId,
        }}
      />
    </div>
  );
}

// ============================================================
// DEAL ROOMS — main (haijabadilishwa kwa kiasi kikubwa)
// ============================================================
export default function DealRooms({
  side = "seller",
  initialDealId = null,
  onReservationPaid,
  onFinalPaymentConfirmed,
}) {
  const { user } = useAuth();
  const deals = useDeals(user?.id, side);
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(initialDealId);
  const [mobileShowDetail, setMobileShowDetail] = useState(Boolean(initialDealId));
  const [transactionIds, setTransactionIds] = useState({});
  const [offlineMode, setOfflineMode] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const listingIdParam = searchParams.get("listing");
  const actionParam = searchParams.get("action");

  useEffect(() => {
    if (initialDealId) {
      setSelectedId(initialDealId);
      setMobileShowDetail(true);
    }
  }, [initialDealId]);

  useEffect(() => {
    if (actionParam !== "reserve" || !listingIdParam) return;
    const targetDeal = deals.find(
      (d) => String(d.listingId) === String(listingIdParam)
    );
    if (targetDeal) {
      setSelectedId(targetDeal.id);
      setMobileShowDetail(true);
    }
  }, [deals, actionParam, listingIdParam]);

  const selectedDeal =
    deals.find((d) => d.id === selectedId) || deals[0];
  const updateDeal = (id, patchOrUpdater) => {
    updateDealInStore(id, patchOrUpdater);
  };
  const handleSelect = (id) => {
    setSelectedId(id);
    setMobileShowDetail(true);
  };

  const [detailFetchedAt, setDetailFetchedAt] = useState({});
  const [detailError, setDetailError] = useState({});
  // Idadi ya ujumbe unaotumwa sasa hivi — polling inasubiri ili isifute
  // ujumbe wa muda (optimistic) kabla seva haijajibu.
  const sendingRef = useRef(0);

  useEffect(() => {
    if (!selectedDeal?.id) return;
    const lastFetch = detailFetchedAt[selectedDeal.id];
    if (lastFetch && Date.now() - lastFetch < 5000) return;
    if (detailError[selectedDeal.id] === "not_found") return;

    setDetailFetchedAt((prev) => ({
      ...prev,
      [selectedDeal.id]: Date.now(),
    }));

    fetchDealDetailAsync(selectedDeal.dealRoomId || selectedDeal.id)
      .then((res) => {
        if (res?.ok && res.deal) {
          updateDealInStore(selectedDeal.id, (prev) =>
            mergeServerDeal(prev, res.deal)
          );
        } else if (res?.error) {
          const status = res.error?.status;
          if (status === 404) {
            setDetailError((prev) => ({
              ...prev,
              [selectedDeal.id]: "not_found",
            }));
          }
        }
      })
      .catch(() => {
        /* noop */
      });
  }, [selectedDeal?.id]);

  // ── Polling nyepesi: admin akisimamisha/akighairi/akituma ujumbe,
  //    mtumiaji aone ndani ya sekunde chache bila kurefresh ──
  useEffect(() => {
    const id = selectedDeal?.id;
    if (!id) return;
    const roomId = selectedDeal.dealRoomId || id;

    const timer = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      if (sendingRef.current > 0) return;
      fetchDealDetailAsync(roomId)
        .then((res) => {
          if (res?.error?.status === 404) {
            clearInterval(timer);
            return;
          }
          if (res?.ok && res.deal && sendingRef.current === 0) {
            updateDealInStore(id, (prev) => mergeServerDeal(prev, res.deal));
          }
        })
        .catch(() => {
          /* noop */
        });
    }, 15000);

    return () => clearInterval(timer);
  }, [selectedDeal?.id, selectedDeal?.dealRoomId]);

  // ── Alama ya "imesomwa": inatumwa tu room inapokuwa wazi na inaonekana
  //    (si orodha tu kwenye simu, si tab iliyofichwa) ──
  const markedReadRef = useRef({});
  const selectedRoomId = selectedDeal?.dealRoomId || selectedDeal?.id;
  const latestUnreadIncomingId = (() => {
    const list = selectedDeal?.messages || [];
    for (let i = list.length - 1; i >= 0; i--) {
      const m = list[i];
      if (
        m.sender !== "me" &&
        m.sender !== "admin" &&
        m.kind !== "ADMIN" &&
        !m.offerAmount &&
        !m.isRead &&
        !m.readAt &&
        !String(m.id).startsWith("m_")
      ) {
        return m.id;
      }
    }
    return null;
  })();

  useEffect(() => {
    if (!selectedRoomId || latestUnreadIncomingId == null) return;
    if (typeof dealsApi.markRead !== "function") return;

    const send = () => {
      const isMobileView =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(max-width: 767px)").matches;
      const detailVisible = !isMobileView || mobileShowDetail;
      if (!detailVisible) return;
      if (document.visibilityState === "hidden") return;
      if (markedReadRef.current[selectedRoomId] === latestUnreadIncomingId) {
        return;
      }
      markedReadRef.current[selectedRoomId] = latestUnreadIncomingId;
      dealsApi.markRead(selectedRoomId).catch(() => {
        // Ikishindwa, ruhusu jaribio lingine kwenye polling inayofuata
        delete markedReadRef.current[selectedRoomId];
      });
    };

    send();
    document.addEventListener("visibilitychange", send);
    return () => document.removeEventListener("visibilitychange", send);
  }, [selectedRoomId, latestUnreadIncomingId, mobileShowDetail]);

  const ensureTransactionId = async (deal) => {
    let txId = transactionIds[deal.id] || deal.transactionId;
    if (txId) return txId;

    const res = await callApiOrFallback(() =>
      createTransactionAsync(deal.dealRoomId || deal.id)
    );
    if (res.offline) {
      setOfflineMode(true);
      return null;
    }

    if (!res.ok) {
      const errMsg = String(
        res.error?.message || res.error?.data?.detail || ""
      );
      const isAlreadyCreated =
        errMsg.toLowerCase().includes("tayari imeundwa") ||
        errMsg.toLowerCase().includes("already") ||
        res.error?.status === 400;

      if (isAlreadyCreated) {
        try {
          const detailRes = await dealsApi.detail(
            deal.dealRoomId || deal.id
          );
          const existingTxId =
            detailRes?.transaction_id ?? detailRes?.transaction?.id;
          if (existingTxId) {
            setTransactionIds((prev) => ({
              ...prev,
              [deal.id]: existingTxId,
            }));
            updateDeal(deal.id, { transactionId: existingTxId });
            return existingTxId;
          }
        } catch {
          /* noop */
        }
      }
      return null;
    }

    txId = res.transaction?.id;
    if (txId) {
      setTransactionIds((prev) => ({ ...prev, [deal.id]: txId }));
    }
    return txId;
  };

  const handleSendMessage = async (id, text) => {
    const deal = deals.find((d) => String(d.id) === String(id));
    if (!deal) return;

    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa na msimamizi — huwezi kutuma ujumbe."
          : "Room is suspended by admin — you cannot send messages."
      );
      return;
    }

    const tempId = `m_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender: "me",
      text,
      kind: "USER",
      isHidden: false,
      sendStatus: "sending",
      at: new Date().toISOString(),
    };
    updateDeal(id, (prev) => ({
      ...prev,
      messages: [...(prev.messages || []), optimisticMsg],
    }));

    await deliverMessage(deal, id, tempId, text, optimisticMsg);
  };

  // Hutuma ujumbe kwa seva na kusasisha hali yake (sending → sent / failed).
  const deliverMessage = async (deal, id, tempId, text, optimisticMsg) => {
    sendingRef.current += 1;
    try {
      const res = await dealsApi.sendDealMessage(
        deal.dealRoomId || deal.id,
        { text }
      );
      updateDeal(id, (prev) => {
        const list = prev.messages || [];
        const serverId = res?.id;
        const serverAt = res?.created_at;
        // Kawaida: badilisha ujumbe wa muda na wa seva
        if (list.some((m) => m.id === tempId)) {
          return {
            ...prev,
            messages: list.map((m) =>
              m.id === tempId
                ? {
                    ...m,
                    id: serverId ?? m.id,
                    at: serverAt || m.at,
                    sendStatus: "sent",
                  }
                : m
            ),
          };
        }
        // Polling ilishaleta ujumbe huu — usiurudie
        if (
          serverId != null &&
          list.some((m) => String(m.id) === String(serverId))
        ) {
          return prev;
        }
        // Polling ilifuta ujumbe wa muda — urudishe wa seva
        return {
          ...prev,
          messages: [
            ...list,
            {
              ...optimisticMsg,
              id: serverId ?? tempId,
              at: serverAt || optimisticMsg.at,
              sendStatus: "sent",
            },
          ],
        };
      });
    } catch (err) {
      // Usiufute — uonyeshwe "Haikutumwa" na kitufe cha Jaribu tena
      updateDeal(id, (prev) => ({
        ...prev,
        messages: (prev.messages || []).map((m) =>
          m.id === tempId ? { ...m, sendStatus: "failed" } : m
        ),
      }));
      // Admin amesimamisha room wakati mtumiaji yuko ndani — sasisha UI sasa
      if (err?.data?.code === "DEAL_LOCKED" || err?.code === "DEAL_LOCKED") {
        fetchDealDetailAsync(deal.dealRoomId || deal.id)
          .then((r) => {
            if (r?.ok && r.deal)
              updateDealInStore(id, (prev) => mergeServerDeal(prev, r.deal));
          })
          .catch(() => {});
        alert(
          err?.data?.detail ||
            err?.message ||
            (lang === "sw"
              ? "Room imesimamishwa na msimamizi."
              : "Room is suspended by admin.")
        );
      }
    } finally {
      sendingRef.current = Math.max(0, sendingRef.current - 1);
    }
  };

  const handleRetryMessage = async (id, msgId) => {
    const deal = deals.find((d) => String(d.id) === String(id));
    if (!deal) return;
    const failed = (deal.messages || []).find(
      (m) => String(m.id) === String(msgId) && m.sendStatus === "failed"
    );
    if (!failed) return;

    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa na msimamizi — huwezi kutuma ujumbe."
          : "Room is suspended by admin — you cannot send messages."
      );
      return;
    }

    const retried = { ...failed, sendStatus: "sending" };
    updateDeal(id, (prev) => ({
      ...prev,
      messages: (prev.messages || []).map((m) =>
        m.id === failed.id ? retried : m
      ),
    }));
    await deliverMessage(deal, id, failed.id, failed.text, retried);
  };

  const handleSendOffer = async (id, amount) => {
    const deal = deals.find((d) => d.id === id);
    if (deal?.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kutuma ofa."
          : "Room is suspended — you cannot send offers."
      );
      return;
    }
    const res = await sendOfferAsync(id, amount, "", null, user?.id);
    if (!res.ok) {
      alert(
        res.error?.message ||
          (lang === "sw"
            ? "Imeshindwa kutuma ofa. Jaribu tena."
            : "Failed to send offer. Try again.")
      );
    }
  };

  const handleRespond = async (id, newStatus) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;

    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kukubali/kukataa ofa."
          : "Room is suspended — you cannot accept/decline offers."
      );
      return;
    }

    const lastOffer = [...(deal.messages || [])]
      .reverse()
      .find(
        (m) =>
          m.offerAmount &&
          !["declined", "rejected", "cancelled"].includes(
            String(m.status || "").toLowerCase()
          )
      );
    if (!lastOffer || lastOffer.sender === "me") return;

    if (newStatus === "accepted") {
      const res = await acceptOfferAsync(id, lastOffer.id, user?.id);
      if (!res.ok) {
        alert(
          res.error?.message ||
            (lang === "sw"
              ? "Imeshindwa kukubali ofa."
              : "Failed to accept offer.")
        );
      }
      return;
    }

    if (newStatus === "declined") {
      const roomId = deal.dealRoomId || deal.id;
      updateDeal(id, (prev) => ({
        ...prev,
        currentOffer: 0,
        messages: (prev.messages || []).map((m) =>
          String(m.id) === String(lastOffer.id)
            ? { ...m, status: "declined" }
            : m
        ),
      }));
      try {
        try {
          await dealsApi.declineOffer(roomId, lastOffer.id);
        } catch (declineErr) {
          if (
            declineErr?.status !== 404 &&
            declineErr?.status !== 501
          ) {
            throw declineErr;
          }
        }
        await dealsApi.sendDealMessage(roomId, {
          text:
            lang === "sw"
              ? `Ofa ya ${formatTZS(
                  lastOffer.offerAmount
                )} ilikataliwa.`
              : `The offer of ${formatTZS(
                  lastOffer.offerAmount
                )} was declined.`,
        });
      } catch {
        /* noop */
      }
    }
  };

  const handleReopen = async (id) => {
    const deal = deals.find((d) => String(d.id) === String(id));
    if (!deal) return { ok: false };

    if (deal.cancelledByAdmin) {
      return {
        ok: false,
        error: new Error(
          lang === "sw"
            ? "Deal hii ilighairiwa na msimamizi — haiwezi kufufuliwa."
            : "This deal was cancelled by admin — cannot be reopened."
        ),
      };
    }

    if (deal.adminLocked) {
      return {
        ok: false,
        error: new Error(
          lang === "sw"
            ? "Room imesimamishwa na msimamizi — haiwezi kufufuliwa kwa sasa."
            : "Room is suspended by admin — cannot be reopened right now."
        ),
      };
    }

    const roomId = deal.dealRoomId || deal.id;
    try {
      await reopenDealRoom(roomId);
      const detail = await fetchDealDetailAsync(roomId);
      if (detail?.ok && detail.deal) {
        updateDealInStore(id, detail.deal);
      } else {
        updateDealInStore(id, (prev) => ({
          ...prev,
          status: "negotiating",
          currentOffer: 0,
        }));
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  const finalizeLocalReservation = (id, deal, { hours, fee, method, expiresAt }) => {
    const nowExpiresAt =
      expiresAt ||
      new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const note =
      method === "free"
        ? lang === "sw"
          ? `Reservation imewekwa BURE — muda: ${formatHours(hours, lang)}.`
          : `Reservation placed for FREE — duration: ${formatHours(hours, lang)}.`
        : method === "credits"
          ? lang === "sw"
            ? `Reservation Deposit imelipwa kwa CREDITS — muda: ${formatHours(hours, lang)}.`
            : `Reservation Deposit paid with CREDITS — duration: ${formatHours(hours, lang)}.`
          : lang === "sw"
            ? `Reservation Deposit ya ${formatTZS(fee)} imelipwa (${method}) — muda: ${formatHours(hours, lang)}.`
            : `Reservation Deposit of ${formatTZS(fee)} paid (${method}) — duration: ${formatHours(hours, lang)}.`;

    updateDeal(id, {
      status: "reserved",
      transactionId: deal.transactionId || transactionIds[id] || null,
      reservationHours: hours,
      reservationFee: fee,
      reservationMethod: method,
      reservationExpiresAt: nowExpiresAt,
      reservationPaidAt: new Date().toISOString(),
      pendingPayment: null,
      messages: [
        ...deal.messages,
        {
          id: `m_${Date.now()}`,
          sender: "me",
          kind: "USER",
          isHidden: false,
          text: note,
          at: new Date().toISOString(),
        },
      ],
    });

    onReservationPaid?.(deal, {
      hours,
      fee,
      method,
      expiresAt: nowExpiresAt,
    });
  };

  const handleReserveConfirm = async (id, { hours, fee, method, phone, cardNumber }) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return { ok: false, error: new Error("Deal haipo") };

    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kureserve kwa sasa."
          : "Room is suspended — cannot reserve right now."
      );
      return { ok: false };
    }

    if (detailError[id] === "not_found") {
      alert(
        lang === "sw"
          ? "Deal hii haipo kwenye mfumo. Tafadhali refresh ukurasa."
          : "This deal no longer exists. Please refresh the page."
      );
      return { ok: false };
    }

    let txId = deal.transactionId;
    if (!txId) txId = await ensureTransactionId(deal);

    if (!txId) {
      alert(
        lang === "sw"
          ? "Imeshindwa kuunda transaction. Jaribu tena."
          : "Failed to create transaction. Please try again."
      );
      return { ok: false };
    }

    if (method === "credits") {
      try {
        const payRes = await callApiOrFallback(() =>
          payReservationAsync(txId, { paymentReference: "credits" })
        );
        if (!payRes.offline && !payRes.ok) {
          alert(
            payRes.error?.message ||
              (lang === "sw"
                ? "Imeshindwa kutumia credit."
                : "Failed to use credit.")
          );
          return { ok: false };
        }
        const expiresAt =
          payRes.transaction?.reservationExpiresAt ||
          new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        finalizeLocalReservation(id, deal, {
          hours,
          fee: 0,
          method: "credits",
          expiresAt,
        });
        return { ok: true };
      } catch (err) {
        alert(
          err?.message ||
            (lang === "sw"
              ? "Imeshindwa kutumia credit."
              : "Failed to use credit.")
        );
        return { ok: false };
      }
    }

    const reserveRes = await callApiOrFallback(() =>
      createReservationAsync(txId, hours)
    );
    if (reserveRes.offline) {
      alert(
        lang === "sw"
          ? "Backend haipatikani. Jaribu tena baadaye."
          : "Backend unavailable. Try again later."
      );
      return { ok: false };
    }
    if (!reserveRes.ok) {
      alert(
        reserveRes.error?.message ||
          (lang === "sw"
            ? "Imeshindwa kuweka reservation."
            : "Failed to create reservation.")
      );
      return { ok: false };
    }

    const activatedStatus = reserveRes.transaction?.status;
    if (activatedStatus === TX_STATUS.RESERVED_PAID) {
      const expiresAt =
        reserveRes.transaction.reservationExpiresAt ||
        new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      finalizeLocalReservation(id, deal, {
        hours,
        fee: 0,
        method: "free",
        expiresAt,
      });
      return { ok: true };
    }

    const isMobile = isMobileMoneyMethod(method);
    const isBank = isBankMethod(method);
    const paymentMethodKey = isBank
      ? "card"
      : isMobile
        ? "mobile"
        : "";

    const payRes = await callApiOrFallback(() =>
      payReservationAsync(txId, {
        paymentReference: null,
        paymentMethod: paymentMethodKey,
        phone: isMobile ? phone || "" : "",
      })
    );

    if (!payRes.offline && !payRes.ok) {
      alert(
        payRes.error?.message ||
          (lang === "sw"
            ? "Imeshindwa kulipa reservation."
            : "Failed to pay reservation.")
      );
      return { ok: false };
    }

    if (payRes.pending) {
      updateDeal(id, {
        status: "accepted",
        pendingPayment: {
          orderId: payRes.orderId,
          reference: payRes.reference,
          checkoutUrl: payRes.checkoutUrl,
          amount: fee,
          method,
        },
        messages: [
          ...deal.messages,
          {
            id: `m_${Date.now()}`,
            sender: "me",
            kind: "USER",
            isHidden: false,
            text:
              lang === "sw"
                ? `Malipo ya Reservation yameanzishwa (${method}). Kumbukumbu: ${payRes.reference}. Tafadhali kamilisha malipo.`
                : `Reservation payment initiated (${method}). Reference: ${payRes.reference}. Please complete payment.`,
            at: new Date().toISOString(),
          },
        ],
      });

      if (payRes.checkoutUrl) {
        try {
          window.open(
            payRes.checkoutUrl,
            "_blank",
            "noopener,noreferrer"
          );
        } catch {
          /* noop */
        }
      }

      const pollRes = await pollReservationStatusAsync(txId, {
        attempts: 15,
        intervalMs: 4000,
      });

      if (pollRes.ok) {
        const expiresAt =
          pollRes.transaction.reservationExpiresAt || null;
        finalizeLocalReservation(id, deal, {
          hours,
          fee,
          method,
          expiresAt,
        });
        return { ok: true };
      } else {
        alert(
          lang === "sw"
            ? "Malipo bado hayajathibitishwa. Angalia 'My Transactions' baadaye."
            : "Payment is not yet confirmed. Please check 'My Transactions' shortly."
        );
        return { ok: false };
      }
    }

    const expiresAt =
      payRes.transaction?.reservationExpiresAt ||
      new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    finalizeLocalReservation(id, deal, {
      hours,
      fee,
      method,
      expiresAt,
    });
    return { ok: true };
  };

  const handleInspectionResolve = async (id, outcome, note) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;

    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kuchukua hatua."
          : "Room is suspended — you cannot take action."
      );
      return;
    }

    let txId = transactionIds[id] || deal.transactionId;

    if (!txId) {
      try {
        const detailRes = await dealsApi.detail(
          deal.dealRoomId || deal.id
        );
        txId =
          detailRes?.transaction_id ?? detailRes?.transaction?.id;
        if (txId) {
          setTransactionIds((prev) => ({ ...prev, [id]: txId }));
          updateDeal(id, { transactionId: txId });
        }
      } catch {
        /* noop */
      }
    }

    if (!txId) {
      alert(
        lang === "sw"
          ? "Transaction haipatikani kwa deal hii."
          : "Transaction not found for this deal."
      );
      return;
    }

    let apiRes;
    if (outcome === "READY_FOR_FINAL_PAYMENT") {
      apiRes = await callApiOrFallback(() =>
        submitDecisionAsync(txId, {
          buyerDecision: "ACCEPT",
          buyerDecisionNote: note || "",
        })
      );
    } else if (outcome === "REQUEST_NEGOTIATION") {
      apiRes = await callApiOrFallback(() =>
        submitDecisionAsync(txId, {
          buyerDecision: "REQUEST_NEGOTIATION",
          buyerDecisionNote: note || "",
        })
      );
    } else if (outcome === "NOT_AS_DESCRIBED") {
      apiRes = await callApiOrFallback(() =>
        submitDecisionAsync(txId, {
          buyerDecision: "REJECT",
          buyerDecisionNote: note || "",
        })
      );
    } else if (outcome === "CANCEL") {
      apiRes = await callApiOrFallback(() =>
        cancelTransactionAsync(txId, note || "")
      );
    }

    if (apiRes && !apiRes.offline && !apiRes.ok) {
      alert(
        apiRes.error?.message ||
          (lang === "sw"
            ? "Imeshindwa kusasisha."
            : "Failed to update.")
      );
      return;
    }

    const baseNote =
      {
        READY_FOR_FINAL_PAYMENT:
          lang === "sw"
            ? "Mnunuzi ameridhika na ukaguzi — tayari kwa malipo ya mwisho."
            : "Buyer is satisfied with the inspection — ready for final payment.",
        REQUEST_NEGOTIATION:
          lang === "sw"
            ? "Mnunuzi ameomba negotiation nyingine baada ya ukaguzi."
            : "Buyer requested another negotiation after inspection.",
        NOT_AS_DESCRIBED:
          lang === "sw"
            ? "Mnunuzi ameripoti: bidhaa/mali sio kama ilivyoelezwa."
            : "Buyer reported: the property is not as described.",
        CANCEL:
          lang === "sw"
            ? "Mnunuzi ameghairi deal baada ya ukaguzi."
            : "Buyer cancelled the deal after inspection.",
      }[outcome] || "";

    const fullNote = note
      ? `${baseNote} ${lang === "sw" ? "Sababu" : "Reason"}: ${note}`
      : baseNote;

    const newMessages = [
      ...deal.messages,
      {
        id: `m_${Date.now()}`,
        sender: "me",
        kind: "USER",
        isHidden: false,
        text: fullNote,
        at: new Date().toISOString(),
      },
    ];

    if (outcome === "READY_FOR_FINAL_PAYMENT") {
      updateDeal(id, {
        status: "awaiting_final_payment",
        messages: newMessages,
      });
    } else if (outcome === "REQUEST_NEGOTIATION") {
      updateDeal(id, {
        status: "disputed",
        disputeNote: note,
        messages: newMessages,
      });
    } else if (outcome === "NOT_AS_DESCRIBED") {
      updateDeal(id, {
        status: "disputed",
        disputeNote: note,
        messages: newMessages,
      });
    } else if (outcome === "CANCEL") {
      updateDeal(id, {
        status: "cancelled",
        cancelNote: note,
        messages: newMessages,
      });
    }
  };

  const handleProofSubmit = async (id, proof) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;
    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kupakia uthibitisho."
          : "Room is suspended — cannot upload proof."
      );
      return;
    }
    const txId = transactionIds[id] || deal.transactionId;
    if (!txId) {
      alert(
        lang === "sw"
          ? "Transaction haipatikani."
          : "Transaction not found."
      );
      return;
    }

    try {
      const apiRes = await uploadFinalPaymentAsync(txId, {
        finalPaymentProof: proof.file,
        finalPaymentReference: proof.reference,
      });
      if (apiRes && apiRes.ok === false) {
        alert(
          apiRes.error?.message ||
            (lang === "sw"
              ? "Imeshindwa kupakia uthibitisho."
              : "Failed to upload proof.")
        );
        return;
      }
    } catch (err) {
      alert(
        err?.message ||
          (lang === "sw"
            ? "Imeshindwa kupakia uthibitisho."
            : "Failed to upload proof.")
      );
      return;
    }

    const note =
      lang === "sw"
        ? `Uthibitisho wa malipo umetumwa (${proof.method}, Ref: ${proof.reference}).`
        : `Payment proof submitted (${proof.method}, Ref: ${proof.reference}).`;

    updateDeal(id, {
      status: "payment_proof_submitted",
      paymentProof: {
        method: proof.method,
        reference: proof.reference,
        submittedAt: new Date().toISOString(),
      },
      messages: [
        ...deal.messages,
        {
          id: `m_${Date.now()}`,
          sender: "me",
          kind: "USER",
          isHidden: false,
          text: note,
          at: new Date().toISOString(),
        },
      ],
    });
  };

  const handleProofConfirm = async (id) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;
    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kuthibitisha malipo."
          : "Room is suspended — cannot confirm payment."
      );
      return;
    }
    const txId = transactionIds[id] || deal.transactionId;
    if (!txId) {
      alert(
        lang === "sw"
          ? "Transaction haipatikani."
          : "Transaction not found."
      );
      return;
    }

    const apiRes = await callApiOrFallback(() =>
      confirmPaymentAsync(txId, "")
    );
    if (!apiRes.offline && !apiRes.ok) {
      alert(
        apiRes.error?.message ||
          (lang === "sw"
            ? "Imeshindwa kuthibitisha malipo."
            : "Failed to confirm payment.")
      );
      return;
    }

    const note =
      lang === "sw"
        ? "Muuzaji amethibitisha: Nimepokea Malipo. Muamala umekamilika."
        : "Seller confirmed: Payment received. Transaction completed.";

    updateDeal(id, {
      status: "completed",
      messages: [
        ...deal.messages,
        {
          id: `m_${Date.now()}`,
          sender: "me",
          kind: "USER",
          isHidden: false,
          text: note,
          at: new Date().toISOString(),
        },
      ],
    });

    onFinalPaymentConfirmed?.(deal, side, {
      method: deal.paymentProof?.method,
      reference: deal.paymentProof?.reference,
    });
  };

  const handleProofReject = async (id, reason) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;
    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kutuma."
          : "Room is suspended — cannot send."
      );
      return;
    }
    const txId = transactionIds[id] || deal.transactionId;
    if (!txId) {
      alert(
        lang === "sw"
          ? "Transaction haipatikani."
          : "Transaction not found."
      );
      return;
    }

    try {
      await transactionsApi.rejectPaymentProof(txId, reason || "");
    } catch (err) {
      alert(
        err?.message ||
          (lang === "sw" ? "Imeshindwa kutuma." : "Failed to send.")
      );
      return;
    }

    const note = reason
      ? lang === "sw"
        ? `Muuzaji bado hajapokea malipo. Sababu: ${reason}. Tafadhali pakia uthibitisho tena.`
        : `Seller has not received payment yet. Reason: ${reason}. Please re-upload proof.`
      : lang === "sw"
        ? "Muuzaji bado hajapokea malipo. Tafadhali pakia uthibitisho tena."
        : "Seller has not received payment yet. Please re-upload proof.";

    updateDeal(id, {
      status: "awaiting_final_payment",
      paymentProof: null,
      messages: [
        ...deal.messages,
        {
          id: `m_${Date.now()}`,
          sender: "me",
          kind: "USER",
          isHidden: false,
          text: note,
          at: new Date().toISOString(),
        },
      ],
    });
  };

  return (
    <div
      style={{ background: COLORS.sand, minHeight: "600px" }}
      className="w-full"
    >
      <div className="p-4 sm:p-6 pb-0 text-center">
        <h1 className="h-title">
          {lang === "sw" ? "Vyumba vya Majadiliano" : "Deal Rooms"}
        </h1>
        <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
          {side === "seller"
            ? lang === "sw"
              ? "Negotiate moja kwa moja na wanunuzi wenye nia ya mali yako."
              : "Negotiate directly with buyers interested in your property."
            : lang === "sw"
              ? "Negotiate moja kwa moja na wauzaji wa mali unazovutiwa nazo."
              : "Negotiate directly with sellers of properties you're interested in."}
        </p>
        {offlineMode && (
          <p
            style={{ color: COLORS.rust }}
            className="text-body-sm mt-2 max-w-xl mx-auto"
          >
            {lang === "sw"
              ? "⚠️ Backend haipatikani."
              : "⚠️ Backend unavailable."}
          </p>
        )}
      </div>

      <div className="flex" style={{ height: "560px" }}>
        <div
          style={{ borderColor: COLORS.sandLine }}
          className={`${
            mobileShowDetail ? "hidden" : "flex"
          } md:flex flex-col w-full md:w-80 shrink-0 border-r px-3 sm:px-4 pb-4 gap-2 overflow-y-auto`}
        >
          {deals.map((d) => (
            <DealListItem
              key={d.id}
              deal={d}
              active={d.id === selectedDeal?.id}
              onSelect={handleSelect}
              lang={lang}
            />
          ))}
        </div>

        <div
          className={`${
            mobileShowDetail ? "flex" : "hidden"
          } md:flex flex-1 min-w-0 flex-col`}
        >
          {selectedDeal ? (
            <DealDetail
              deal={selectedDeal}
              side={side}
              lang={lang}
              user={user}
              onBack={() => setMobileShowDetail(false)}
              onSendMessage={handleSendMessage}
              onRetryMessage={handleRetryMessage}
              onSendOffer={handleSendOffer}
              onRespond={handleRespond}
              onReopen={handleReopen}
              onReserveConfirm={handleReserveConfirm}
              onInspectionResolve={handleInspectionResolve}
              onProofSubmit={handleProofSubmit}
              onProofConfirm={handleProofConfirm}
              onProofReject={handleProofReject}
              onShowSuccess={() => setSuccessModalOpen(true)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted text-sm">
                {lang === "sw"
                  ? "Chagua deal room kuanza mazungumzo."
                  : "Select a deal room to start chatting."}
              </p>
            </div>
          )}
        </div>
      </div>

      <ReservationSuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        onContinueDeal={() => setSuccessModalOpen(false)}
        onGoToReservations={() => {
          setSuccessModalOpen(false);
          navigate("/dashboard/buyer/reservations");
        }}
        lang={lang}
      />
    </div>
  );
}