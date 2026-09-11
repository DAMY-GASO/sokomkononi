import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  Send,
  Check,
  X,
  HandCoins,
  MapPin,
  ChevronDown,
  Clock3,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  Ban,
  SearchCheck,
  Upload,
  FileImage,
  ThumbsDown,
  PartyPopper,
  Paperclip,
} from "lucide-react";
import { COLORS, FONTS, getCategory, formatTZS, timeAgo } from "./shared";
import { useReservationRates, calcReservationFee } from "../../config/feePolicy.js";
import { useDeals, updateDeal as updateDealInStore } from "../../config/dealsStore.js";

const DEAL_STATUS = {
  negotiating: { label: "Inaendelea", bg: "rgba(47,109,79,0.12)", fg: COLORS.green },
  offer_sent: { label: "Ofa Imetumwa", bg: "rgba(232,163,61,0.16)", fg: "#8A5A16" },
  accepted: { label: "Imekubaliwa", bg: "rgba(47,109,79,0.16)", fg: COLORS.green },
  declined: { label: "Imekataliwa", bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
  reserved: { label: "Inspection Period", bg: "rgba(16,26,46,0.08)", fg: COLORS.night },
  awaiting_final_payment: { label: "Tayari kwa Malipo ya Mwisho", bg: "rgba(37,99,235,0.12)", fg: "#2563EB" },
  payment_proof_submitted: { label: "Uthibitisho Umetumwa", bg: "rgba(232,163,61,0.16)", fg: "#8A5A16" },
  completed: { label: "Imekamilika", bg: "rgba(47,109,79,0.18)", fg: COLORS.green },
  disputed: { label: "Mgogoro — Chini ya Ukaguzi", bg: "rgba(193,80,46,0.16)", fg: COLORS.rust },
  cancelled: { label: "Imeghairiwa", bg: "rgba(16,26,46,0.08)", fg: COLORS.night },
};

// ============================================================
// RESERVATION FEE — 100% mapato ya SokoMkononi.
// Namba za bei HAZIPO hapa tena — zinasomwa moja kwa moja kutoka
// Admin Dashboard > Revenue kupitia ../../config/feePolicy.js.
// Ukibadilisha bei pale, ukurasa huu unasasishwa papo hapo.
// ============================================================
const CUSTOM_MIN_HOURS = 1;
const CUSTOM_MAX_HOURS = 336; // siku 14

const PAYMENT_METHODS = ["M-Pesa", "Tigo Pesa", "Airtel Money", "HaloPesa", "Benki (CRDB)"];

function formatHours(hours) {
  if (hours % 24 === 0) {
    const days = hours / 24;
    return `Saa ${hours} (Siku ${days})`;
  }
  return `Saa ${hours}`;
}

// ============================================================
// INSPECTION FLOW — chaguzi 4 za mnunuzi baada ya Inspection Period
// ============================================================
const INSPECTION_OPTIONS = [
  {
    key: "READY_FOR_FINAL_PAYMENT",
    label: "Tayari — Endelea na Malipo ya Mwisho",
    desc: "Nimeridhika baada ya ukaguzi, mali/bidhaa ni sawa na maelezo.",
    icon: CheckCircle2,
    tone: { fg: COLORS.green, bg: "rgba(47,109,79,0.08)", border: COLORS.green },
  },
  {
    key: "REQUEST_NEGOTIATION",
    label: "Omba Negotiation Nyingine",
    desc: "Ukaguzi umeonyesha jambo linalohitaji majadiliano ya bei/masharti.",
    icon: RefreshCcw,
    tone: { fg: "#8A5A16", bg: "rgba(232,163,61,0.12)", border: COLORS.gold },
  },
  {
    key: "NOT_AS_DESCRIBED",
    label: "Sio Kama Ilivyoelezwa",
    desc: "Kuna tofauti kubwa kati ya maelezo na hali halisi — hii ni mgogoro.",
    icon: AlertTriangle,
    tone: { fg: COLORS.rust, bg: "rgba(193,80,46,0.1)", border: COLORS.rust },
  },
  {
    key: "CANCEL",
    label: "Ghairi Deal",
    desc: "Sitaki kuendelea na ununuzi huu.",
    icon: Ban,
    tone: { fg: COLORS.night, bg: "rgba(16,26,46,0.05)", border: COLORS.sandLine },
  },
];

const INSPECTION_RESULT_MESSAGES = {
  READY_FOR_FINAL_PAYMENT: "Mnunuzi ameridhika na ukaguzi — tayari kwa malipo ya mwisho.",
  REQUEST_NEGOTIATION: "Mnunuzi ameomba negotiation nyingine baada ya ukaguzi.",
  NOT_AS_DESCRIBED: "Mnunuzi ameripoti: bidhaa/mali sio kama ilivyoelezwa.",
  CANCEL: "Mnunuzi ameghairi deal baada ya ukaguzi.",
};

function InspectionPanel({ deal, onResolve }) {
  const [step, setStep] = useState("choose"); // choose -> reason
  const [pendingKey, setPendingKey] = useState(null);
  const [note, setNote] = useState("");

  const needsReason = pendingKey === "NOT_AS_DESCRIBED" || pendingKey === "CANCEL";
  const pendingOption = INSPECTION_OPTIONS.find((o) => o.key === pendingKey);

  const handleChoose = (key) => {
    if (key === "NOT_AS_DESCRIBED" || key === "CANCEL") {
      setPendingKey(key);
      setStep("reason");
    } else {
      onResolve(key, "");
    }
  };

  const handleSubmitReason = () => {
    if (pendingKey === "NOT_AS_DESCRIBED" && !note.trim()) return;
    onResolve(pendingKey, note.trim());
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="border-t px-3 sm:px-4 py-3 flex flex-col gap-3"
    >
      {step === "choose" && (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SearchCheck size={14} color={COLORS.night} />
              <p style={{ color: COLORS.night }} className="text-xs font-semibold">
                Inspection Period — chagua hatua inayofuata
              </p>
            </div>
            {deal.reservationExpiresAt && (
              <span style={{ color: COLORS.rust }} className="text-[10px] font-semibold shrink-0">
                Inaisha: {new Date(deal.reservationExpiresAt).toLocaleString("sw-TZ")}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {INSPECTION_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleChoose(opt.key)}
                style={{ borderColor: opt.tone.border, background: opt.tone.bg }}
                className="flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left"
              >
                <opt.icon size={16} color={opt.tone.fg} className="mt-0.5 shrink-0" />
                <div>
                  <p style={{ color: opt.tone.fg }} className="text-xs font-semibold">
                    {opt.label}
                  </p>
                  <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-[11px] mt-0.5">
                    {opt.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "reason" && (
        <>
          <div className="flex items-center gap-2">
            <pendingOption.icon size={14} color={pendingOption.tone.fg} />
            <p style={{ color: COLORS.night }} className="text-xs font-semibold">
              {pendingOption.label}
            </p>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              pendingKey === "NOT_AS_DESCRIBED"
                ? "Eleza tofauti ulizoziona (lazima ujaze hii kwa mgogoro)..."
                : "Sababu (hiari)..."
            }
            rows={3}
            style={{ background: COLORS.sand, borderColor: COLORS.sandLine, color: COLORS.night }}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
          />

          {pendingKey === "NOT_AS_DESCRIBED" && !note.trim() && (
            <p style={{ color: COLORS.rust }} className="text-[11px]">
              Tafadhali eleza tofauti kabla ya kuendelea, ili timu ya SokoMkononi iweze kusaidia.
            </p>
          )}

          <p style={{ color: "rgba(16,26,46,0.45)" }} className="text-[11px]">
            Reservation Fee uliyolipa ({formatTZS(deal.reservationFee || 0)}) ni mapato ya
            SokoMkononi na haitarejeshwa.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                setStep("choose");
                setPendingKey(null);
                setNote("");
              }}
              style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
              className="text-xs font-semibold px-3 py-2 rounded-lg border"
            >
              Rudi Nyuma
            </button>
            <button
              onClick={handleSubmitReason}
              disabled={pendingKey === "NOT_AS_DESCRIBED" && !note.trim()}
              style={{
                background: pendingOption.tone.fg,
                color: "white",
                opacity: pendingKey === "NOT_AS_DESCRIBED" && !note.trim() ? 0.5 : 1,
              }}
              className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg"
            >
              Thibitisha
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// PAYMENT PROOF UPLOAD — mnunuzi analipa nje ya app (M-Pesa/Benki/n.k)
// kisha anapakia risiti/screenshot kama uthibitisho.
// ============================================================
function PaymentProofPanel({ deal, onSubmit }) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const canSubmit = !!preview && reference.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onSubmit({ fileName, dataUrl: preview, reference: reference.trim(), method });
    }, 700);
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="border-t px-3 sm:px-4 py-3 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <Upload size={14} color={COLORS.night} />
        <p style={{ color: COLORS.night }} className="text-xs font-semibold">
          Pakia Uthibitisho wa Malipo ya Mwisho — {formatTZS(deal.currentOffer)}
        </p>
      </div>
      <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-[11px] -mt-1.5">
        Lipa {formatTZS(deal.currentOffer)} moja kwa moja kwa muuzaji (M-Pesa/Benki/n.k), kisha
        pakia risiti au screenshot ya malipo hapa.
      </p>

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
          <img src={preview} alt="Risiti" className="w-14 h-14 rounded-lg object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <p style={{ color: COLORS.night }} className="text-xs font-medium truncate">
              {fileName}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ color: COLORS.green }}
              className="text-[11px] font-semibold"
            >
              Badilisha picha
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ borderColor: COLORS.sandLine, color: "rgba(16,26,46,0.55)" }}
          className="rounded-xl border-2 border-dashed py-5 flex flex-col items-center gap-1.5"
        >
          <FileImage size={22} color="rgba(16,26,46,0.35)" />
          <span className="text-xs font-medium">Bofya kupakia risiti/screenshot</span>
        </button>
      )}

      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Namba ya muamala / Reference (mf. QGH7X92K1)"
        style={{ background: COLORS.sand, borderColor: COLORS.sandLine, color: COLORS.night }}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
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
            className="rounded-lg border px-2.5 py-2 text-xs font-medium text-left"
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
        className="text-xs font-semibold px-3 py-2.5 rounded-lg"
      >
        {submitting ? "Inatuma..." : "Tuma Uthibitisho wa Malipo"}
      </button>
    </div>
  );
}

// ============================================================
// PAYMENT PROOF REVIEW — muuzaji anakagua risiti na kubonyeza
// "Nimepokea Malipo" ndipo transaction inakamilika (COMPLETED).
// ============================================================
function PaymentProofReview({ deal, onConfirm, onReject }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const proof = deal.paymentProof;

  const handleConfirm = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      onConfirm();
    }, 600);
  };

  const handleReject = () => {
    onReject(reason.trim());
    setRejecting(false);
    setReason("");
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="border-t px-3 sm:px-4 py-3 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <Paperclip size={14} color={COLORS.night} />
        <p style={{ color: COLORS.night }} className="text-xs font-semibold">
          Uthibitisho wa Malipo kutoka kwa Mnunuzi
        </p>
      </div>

      {proof && (
        <div
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
          className="rounded-xl border p-3 flex items-center gap-3"
        >
          <img
            src={proof.dataUrl}
            alt="Risiti ya malipo"
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
          <div className="min-w-0 text-xs">
            <p style={{ color: COLORS.night }} className="font-semibold">
              {formatTZS(deal.currentOffer)} · {proof.method}
            </p>
            <p style={{ color: "rgba(16,26,46,0.6)" }} className="mt-0.5">
              Ref: <span className="font-mono">{proof.reference}</span>
            </p>
            <p style={{ color: "rgba(16,26,46,0.4)" }} className="mt-0.5">
              Zimetumwa {timeAgo(proof.submittedAt)}
            </p>
          </div>
        </div>
      )}

      {!rejecting ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRejecting(true)}
            style={{ borderColor: "rgba(193,80,46,0.35)", color: COLORS.rust }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border"
          >
            <ThumbsDown size={13} /> Bado Sijapokea
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            style={{ background: COLORS.green, color: "white" }}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg disabled:opacity-70"
          >
            <Check size={14} /> {busy ? "Inathibitisha..." : "Nimepokea Malipo — Kamilisha"}
          </button>
        </div>
      ) : (
        <>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Kwa nini bado hujapokea? (hiari)"
            rows={2}
            style={{ background: COLORS.sand, borderColor: COLORS.sandLine, color: COLORS.night }}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRejecting(false)}
              style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
              className="text-xs font-semibold px-3 py-2 rounded-lg border"
            >
              Ghairi
            </button>
            <button
              onClick={handleReject}
              style={{ background: COLORS.rust, color: "white" }}
              className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg"
            >
              Tuma — Muulize Mnunuzi Apakie Tena
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Mock deal rooms yamehamishiwa ../../config/dealsStore.js (SEED_DEALS)
// ili AdminDashboard.jsx ione deal ZILEZILE, sio seti tofauti ya data.

function DealListItem({ deal, active, onSelect }) {
  const category = getCategory(deal.category);
  const Icon = category?.icon;
  const status = DEAL_STATUS[deal.status];
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
          <p style={{ color: COLORS.night }} className="text-sm font-semibold truncate">
            {deal.counterpartyName}
          </p>
          <span style={{ color: "rgba(16,26,46,0.4)" }} className="text-[10px] shrink-0">
            {timeAgo(lastMessage.at)}
          </span>
        </div>
        <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs truncate mb-1.5">
          {deal.listingTitle}
        </p>
        <span
          style={{ background: status.bg, color: status.fg }}
          className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
        >
          {status.label}
        </span>
      </div>
    </button>
  );
}

function OfferBubble({ amount, mine }) {
  return (
    <div
      style={{
        background: mine ? COLORS.gold : "white",
        borderColor: COLORS.sandLine,
      }}
      className="border rounded-2xl px-4 py-3 max-w-[75%] flex items-center gap-2"
    >
      <HandCoins size={16} color={mine ? COLORS.night : COLORS.rust} />
      <div>
        <p style={{ color: mine ? COLORS.night : "rgba(16,26,46,0.55)" }} className="text-[11px]">
          Ofa
        </p>
        <p style={{ color: mine ? COLORS.night : COLORS.rust }} className="text-sm font-bold">
          {formatTZS(amount)}
        </p>
      </div>
    </div>
  );
}

function ReservationPanel({ deal, onCancel, onConfirm }) {
  const [step, setStep] = useState("choose"); // choose -> pay
  const [selected, setSelected] = useState(24); // 24 | 48 | 72 | "custom"
  const [customHours, setCustomHours] = useState(96);
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [paying, setPaying] = useState(false);
  const reservationRates = useReservationRates();
  const reservationOptions = reservationRates.filter((r) => r.hours != null);

  const hours = selected === "custom" ? customHours : selected;
  const fee = calcReservationFee(Number(hours));
  const validCustom =
    selected !== "custom" ||
    (Number(customHours) >= CUSTOM_MIN_HOURS && Number(customHours) <= CUSTOM_MAX_HOURS);

  const handlePay = () => {
    if (!validCustom) return;
    setPaying(true);
    // Simulate malipo (M-Pesa/Tigo Pesa/Airtel/n.k) — hakuna gateway halisi bado
    setTimeout(() => {
      setPaying(false);
      onConfirm({ hours, fee, method });
    }, 900);
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="border-t px-3 sm:px-4 py-3 flex flex-col gap-3"
    >
      {step === "choose" && (
        <>
          <div className="flex items-center gap-2">
            <Clock3 size={14} color={COLORS.night} />
            <p style={{ color: COLORS.night }} className="text-xs font-semibold">
              Chagua muda wa Reservation
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {reservationOptions.map((opt) => (
              <button
                key={opt.hours}
                onClick={() => setSelected(opt.hours)}
                style={{
                  borderColor: selected === opt.hours ? COLORS.green : COLORS.sandLine,
                  background: selected === opt.hours ? "rgba(47,109,79,0.08)" : "white",
                }}
                className="rounded-xl border px-2 py-2.5 text-center"
              >
                <p style={{ color: COLORS.night }} className="text-sm font-bold">
                  {opt.label}
                </p>
                <p style={{ color: "rgba(16,26,46,0.5)" }} className="text-[10px] mb-1">
                  {opt.sub}
                </p>
                <p style={{ color: COLORS.green }} className="text-[11px] font-semibold">
                  {formatTZS(opt.fee)}
                </p>
              </button>
            ))}
          </div>

          <button
            onClick={() => setSelected("custom")}
            style={{
              borderColor: selected === "custom" ? COLORS.green : COLORS.sandLine,
              background: selected === "custom" ? "rgba(47,109,79,0.08)" : "white",
            }}
            className="rounded-xl border px-3 py-2.5 flex items-center justify-between"
          >
            <span style={{ color: COLORS.night }} className="text-xs font-semibold">
              Muda Mwingine (Custom)
            </span>
            {selected === "custom" ? (
              <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min={CUSTOM_MIN_HOURS}
                  max={CUSTOM_MAX_HOURS}
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value.replace(/\D/g, ""))}
                  style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
                  className="w-16 rounded-md border px-2 py-1 text-xs outline-none text-right"
                />
                <span style={{ color: "rgba(16,26,46,0.55)" }} className="text-[11px]">
                  saa
                </span>
              </span>
            ) : (
              <span style={{ color: "rgba(16,26,46,0.45)" }} className="text-[11px]">
                weka saa mwenyewe
              </span>
            )}
          </button>

          {selected === "custom" && !validCustom && (
            <p style={{ color: COLORS.rust }} className="text-[11px]">
              Weka saa kati ya {CUSTOM_MIN_HOURS} na {CUSTOM_MAX_HOURS}.
            </p>
          )}

          {selected === "custom" && validCustom && (
            <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-[11px]">
              {formatHours(Number(customHours))} → Reservation Fee:{" "}
              <span style={{ color: COLORS.green }} className="font-semibold">
                {formatTZS(fee)}
              </span>
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onCancel}
              style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
              className="text-xs font-semibold px-3 py-2 rounded-lg border"
            >
              Ghairi
            </button>
            <button
              onClick={() => validCustom && setStep("pay")}
              disabled={!validCustom}
              style={{
                background: validCustom ? COLORS.green : COLORS.sandLine,
                color: validCustom ? "white" : "rgba(16,26,46,0.4)",
              }}
              className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg"
            >
              Endelea — Lipa {formatTZS(fee)}
            </button>
          </div>
        </>
      )}

      {step === "pay" && (
        <>
          <div className="flex items-center gap-2">
            <CreditCard size={14} color={COLORS.night} />
            <p style={{ color: COLORS.night }} className="text-xs font-semibold">
              Lipa Reservation Fee
            </p>
          </div>

          <div
            style={{ background: COLORS.sand, borderColor: COLORS.sandLine }}
            className="rounded-xl border p-3 flex items-center justify-between"
          >
            <div>
              <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-[11px]">
                {deal.listingTitle} · {formatHours(hours)}
              </p>
              <p style={{ color: COLORS.night }} className="text-base font-bold">
                {formatTZS(fee)}
              </p>
            </div>
            <ShieldCheck size={20} color={COLORS.green} />
          </div>

          <p style={{ color: "rgba(16,26,46,0.5)" }} className="text-[11px]">
            Chagua njia ya malipo
          </p>
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
                className="rounded-lg border px-2.5 py-2 text-xs font-medium text-left"
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setStep("choose")}
              disabled={paying}
              style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
              className="text-xs font-semibold px-3 py-2 rounded-lg border"
            >
              Rudi Nyuma
            </button>
            <button
              onClick={handlePay}
              disabled={paying}
              style={{ background: COLORS.green, color: "white" }}
              className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-70"
            >
              {paying ? "Inathibitisha malipo..." : `Thibitisha Malipo — ${formatTZS(fee)}`}
            </button>
          </div>
          <p style={{ color: "rgba(16,26,46,0.4)" }} className="text-[10px]">
            Kwa demo hii, malipo yanathibitishwa papo hapo. Kwenye uzalishaji itaunganishwa na
            gateway halisi ya M-Pesa/Tigo Pesa/Airtel Money.
          </p>
        </>
      )}
    </div>
  );
}

function DealDetail({
  deal,
  side,
  onBack,
  onSendMessage,
  onSendOffer,
  onRespond,
  onReserveConfirm,
  onInspectionResolve,
  onProofSubmit,
  onProofConfirm,
  onProofReject,
}) {
  const [text, setText] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [reserveOpen, setReserveOpen] = useState(false);
  const category = getCategory(deal.category);
  const status = DEAL_STATUS[deal.status];
  const counterpartyLabel = side === "seller" ? "Mnunuzi" : "Muuzaji";

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(deal.id, text.trim());
    setText("");
  };

  const handleOffer = () => {
    const value = parseInt(offerAmount.replace(/\D/g, ""), 10);
    if (!value) return;
    onSendOffer(deal.id, value);
    setOfferAmount("");
    setOfferOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="flex items-center gap-3 border-b p-3 sm:p-4"
      >
        <button onClick={onBack} className="md:hidden shrink-0" aria-label="Rudi">
          <ArrowLeft size={18} color={COLORS.night} />
        </button>
        <div
          style={{ background: COLORS.night }}
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        >
          {category?.icon && <category.icon size={15} color={COLORS.gold} />}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: COLORS.night }} className="text-sm font-semibold truncate">
            {deal.counterpartyName}{" "}
            <span style={{ color: "rgba(16,26,46,0.4)" }} className="font-normal">
              · {counterpartyLabel}
            </span>
          </p>
          <p style={{ color: "rgba(16,26,46,0.5)" }} className="text-xs truncate flex items-center gap-1">
            <MapPin size={10} /> {deal.listingTitle}
          </p>
        </div>
        <span
          style={{ background: status.bg, color: status.fg }}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
        >
          {status.label}
        </span>
      </div>

      {/* Price strip */}
      <div
        style={{ background: COLORS.sandLine }}
        className="flex items-center justify-between px-4 py-2 text-xs"
      >
        <span style={{ color: "rgba(16,26,46,0.6)" }}>Bei Iliyowekwa: {formatTZS(deal.askingPrice)}</span>
        <span style={{ color: COLORS.rust }} className="font-semibold">
          Ofa ya Sasa: {formatTZS(deal.currentOffer)}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-2.5" style={{ background: COLORS.sand }}>
        {deal.messages.map((m) =>
          m.sender === "admin" ? (
            <div key={m.id} className="flex justify-center my-1">
              <div
                style={{ background: "rgba(16,26,46,0.06)", color: COLORS.night, borderColor: COLORS.sandLine }}
                className="border rounded-xl px-3.5 py-2 max-w-[90%] text-[11px] text-center font-medium"
              >
                <span style={{ color: COLORS.rust }} className="font-bold">SokoMkononi Admin: </span>
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
              {m.offerAmount ? (
                <OfferBubble amount={m.offerAmount} mine={m.sender === "me"} />
              ) : (
                <div
                  style={{
                    background: m.sender === "me" ? COLORS.night : "white",
                    color: m.sender === "me" ? COLORS.sand : COLORS.night,
                    borderColor: COLORS.sandLine,
                  }}
                  className="border rounded-2xl px-4 py-2.5 max-w-[75%] text-sm"
                >
                  {m.text}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Accept / decline row, only while negotiating */}
      {(deal.status === "negotiating" || deal.status === "offer_sent") && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-t"
        >
          <button
            onClick={() => onRespond(deal.id, "accepted")}
            style={{ background: COLORS.green, color: "white" }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
          >
            <Check size={13} /> Kubali Ofa ya {formatTZS(deal.currentOffer)}
          </button>
          <button
            onClick={() => onRespond(deal.id, "declined")}
            style={{ borderColor: "rgba(193,80,46,0.35)", color: COLORS.rust }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border"
          >
            <X size={13} /> Kataa
          </button>
          <button
            onClick={() => setOfferOpen((v) => !v)}
            style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border ml-auto"
          >
            <HandCoins size={13} /> Toa Ofa Nyingine
            <ChevronDown size={12} style={{ transform: offerOpen ? "rotate(180deg)" : "none" }} />
          </button>
        </div>
      )}

      {offerOpen && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-t"
        >
          <input
            style={{ background: COLORS.sand, borderColor: COLORS.sandLine, color: COLORS.night }}
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
            placeholder="Kiasi cha ofa (TZS)"
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
          />
          <button
            onClick={handleOffer}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0"
          >
            Tuma Ofa
          </button>
        </div>
      )}

      {deal.status === "accepted" && !reserveOpen && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "rgba(47,109,79,0.08)" }}
          className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-t"
        >
          <span style={{ color: COLORS.green }} className="text-xs font-medium">
            Mmekubaliana kwenye {formatTZS(deal.currentOffer)}. Hatua inayofuata ni Reservation Deposit.
          </span>
          <button
            onClick={() => setReserveOpen(true)}
            style={{ background: COLORS.green, color: "white" }}
            className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0"
          >
            Weka Reservation
          </button>
        </div>
      )}

      {deal.status === "accepted" && reserveOpen && (
        <ReservationPanel
          deal={deal}
          onCancel={() => setReserveOpen(false)}
          onConfirm={(details) => {
            setReserveOpen(false);
            onReserveConfirm(deal.id, details);
          }}
        />
      )}

      {deal.status === "reserved" && side === "seller" && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "rgba(16,26,46,0.04)" }}
          className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-t text-xs"
        >
          <span style={{ color: COLORS.night }}>
            Reservation Fee {formatTZS(deal.reservationFee)} imelipwa · {deal.reservationMethod} ·
            Mnunuzi yuko kwenye Inspection Period.
          </span>
          {deal.reservationExpiresAt && (
            <span style={{ color: COLORS.rust }} className="font-semibold shrink-0">
              Inaisha: {new Date(deal.reservationExpiresAt).toLocaleString("sw-TZ")}
            </span>
          )}
        </div>
      )}

      {deal.status === "reserved" && side === "buyer" && (
        <InspectionPanel deal={deal} onResolve={(key, note) => onInspectionResolve(deal.id, key, note)} />
      )}

      {deal.status === "awaiting_final_payment" && side === "buyer" && (
        <PaymentProofPanel deal={deal} onSubmit={(proof) => onProofSubmit(deal.id, proof)} />
      )}

      {deal.status === "awaiting_final_payment" && side === "seller" && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "rgba(37,99,235,0.08)" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-3 border-t"
        >
          <CheckCircle2 size={16} color="#2563EB" className="shrink-0" />
          <span style={{ color: "#1E3A8A" }} className="text-xs font-medium">
            Ukaguzi umepita. Mnunuzi anaandaa malipo ya mwisho ya {formatTZS(deal.currentOffer)} na
            atapakia uthibitisho hapa.
          </span>
        </div>
      )}

      {deal.status === "payment_proof_submitted" && side === "seller" && (
        <PaymentProofReview
          deal={deal}
          onConfirm={() => onProofConfirm(deal.id)}
          onReject={(reason) => onProofReject(deal.id, reason)}
        />
      )}

      {deal.status === "payment_proof_submitted" && side === "buyer" && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "rgba(232,163,61,0.1)" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-3 border-t"
        >
          <FileImage size={16} color="#8A5A16" className="shrink-0" />
          <span style={{ color: "#8A5A16" }} className="text-xs font-medium">
            Uthibitisho wako wa malipo umetumwa. Unasubiri muuzaji athibitishe "Nimepokea Malipo".
          </span>
        </div>
      )}

      {deal.status === "completed" && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "rgba(47,109,79,0.1)" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-3 border-t"
        >
          <PartyPopper size={16} color={COLORS.green} className="shrink-0" />
          <span style={{ color: COLORS.green }} className="text-xs font-medium">
            Muamala umekamilika! Malipo yamethibitishwa — angalia My Transactions kwa risiti.
          </span>
        </div>
      )}

      {deal.status === "disputed" && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "rgba(193,80,46,0.08)" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-3 border-t"
        >
          <AlertTriangle size={16} color={COLORS.rust} className="shrink-0" />
          <span style={{ color: COLORS.rust }} className="text-xs font-medium">
            Mnunuzi ameripoti "sio kama ilivyoelezwa". Timu ya SokoMkononi itaingilia kati kusaidia
            kutatua mgogoro huu.
          </span>
        </div>
      )}

      {deal.status === "cancelled" && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "rgba(16,26,46,0.04)" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-3 border-t"
        >
          <Ban size={16} color={COLORS.night} className="shrink-0" />
          <span style={{ color: COLORS.night }} className="text-xs font-medium">
            Deal hii imeghairiwa. Reservation Fee haitarejeshwa.
          </span>
        </div>
      )}

      {/* Composer */}
      {deal.status !== "declined" && deal.status !== "cancelled" && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="flex items-center gap-2 p-3 border-t"
        >
          <input
            style={{ background: COLORS.sand, borderColor: COLORS.sandLine, color: COLORS.night }}
            className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none"
            placeholder="Andika ujumbe..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            aria-label="Tuma"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function DealRooms({ side = "seller", onReservationPaid, onFinalPaymentConfirmed }) {
  const deals = useDeals();
  const [selectedId, setSelectedId] = useState(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const selectedDeal = deals.find((d) => d.id === selectedId) || deals[0];

  const updateDeal = (id, patch) => updateDealInStore(id, patch);

  const handleSelect = (id) => {
    setSelectedId(id);
    setMobileShowDetail(true);
  };

  const handleSendMessage = (id, text) => {
    const deal = deals.find((d) => d.id === id);
    updateDeal(id, {
      messages: [...deal.messages, { id: `m_${Date.now()}`, sender: "me", text, at: new Date().toISOString() }],
    });
  };

  const handleSendOffer = (id, amount) => {
    const deal = deals.find((d) => d.id === id);
    updateDeal(id, {
      currentOffer: amount,
      offerFrom: "me",
      status: "offer_sent",
      messages: [
        ...deal.messages,
        { id: `m_${Date.now()}`, sender: "me", text: "", at: new Date().toISOString(), offerAmount: amount },
      ],
    });
  };

  const handleReserveConfirm = (id, { hours, fee, method }) => {
    const deal = deals.find((d) => d.id === id);
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const note = `Reservation Deposit ya ${formatTZS(fee)} imelipwa (${method}) — muda: ${formatHours(
      hours
    )}. Inaisha ${new Date(expiresAt).toLocaleString("sw-TZ")}.`;

    updateDeal(id, {
      status: "reserved",
      reservationHours: hours,
      reservationFee: fee,
      reservationMethod: method,
      reservationExpiresAt: expiresAt,
      messages: [...deal.messages, { id: `m_${Date.now()}`, sender: "me", text: note, at: new Date().toISOString() }],
    });

    onReservationPaid?.(deal, { hours, fee, method, expiresAt });
  };

  const handleInspectionResolve = (id, outcome, note) => {
    const deal = deals.find((d) => d.id === id);
    const baseNote = INSPECTION_RESULT_MESSAGES[outcome] || "";
    const fullNote = note ? `${baseNote} Sababu: ${note}` : baseNote;
    const newMessages = [
      ...deal.messages,
      { id: `m_${Date.now()}`, sender: "me", text: fullNote, at: new Date().toISOString() },
    ];

    if (outcome === "READY_FOR_FINAL_PAYMENT") {
      updateDeal(id, { status: "awaiting_final_payment", messages: newMessages });
    } else if (outcome === "NOT_AS_DESCRIBED") {
      updateDeal(id, { status: "disputed", disputeNote: note, messages: newMessages });
    } else if (outcome === "REQUEST_NEGOTIATION") {
      updateDeal(id, { status: "negotiating", messages: newMessages });
    } else if (outcome === "CANCEL") {
      updateDeal(id, { status: "cancelled", cancelNote: note, messages: newMessages });
    }
  };

  const handleProofSubmit = (id, proof) => {
    const deal = deals.find((d) => d.id === id);
    const note = `Uthibitisho wa malipo umetumwa (${proof.method}, Ref: ${proof.reference}).`;
    updateDeal(id, {
      status: "payment_proof_submitted",
      paymentProof: { ...proof, submittedAt: new Date().toISOString() },
      messages: [...deal.messages, { id: `m_${Date.now()}`, sender: "me", text: note, at: new Date().toISOString() }],
    });
  };

  const handleProofConfirm = (id) => {
    const deal = deals.find((d) => d.id === id);
    const note = "Muuzaji amethibitisha: Nimepokea Malipo. Muamala umekamilika.";
    updateDeal(id, {
      status: "completed",
      messages: [...deal.messages, { id: `m_${Date.now()}`, sender: "me", text: note, at: new Date().toISOString() }],
    });
    onFinalPaymentConfirmed?.(deal, side, {
      method: deal.paymentProof?.method,
      reference: deal.paymentProof?.reference,
    });
  };

  const handleProofReject = (id, reason) => {
    const deal = deals.find((d) => d.id === id);
    const note = reason
      ? `Muuzaji bado hajapokea malipo. Sababu: ${reason}. Tafadhali pakia uthibitisho tena.`
      : "Muuzaji bado hajapokea malipo. Tafadhali pakia uthibitisho tena.";
    updateDeal(id, {
      status: "awaiting_final_payment",
      paymentProof: null,
      messages: [...deal.messages, { id: `m_${Date.now()}`, sender: "me", text: note, at: new Date().toISOString() }],
    });
  };

  const handleRespond = (id, newStatus) => {
    const deal = deals.find((d) => d.id === id);
    const note =
      newStatus === "accepted"
        ? `Ofa ya ${formatTZS(deal.currentOffer)} imekubaliwa.`
        : "Ofa imekataliwa.";
    updateDeal(id, {
      status: newStatus,
      messages: [...deal.messages, { id: `m_${Date.now()}`, sender: "me", text: note, at: new Date().toISOString() }],
    });
  };

  return (
    <div style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "600px" }} className="w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="p-4 sm:p-6 pb-0">
        <h1 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl sm:text-3xl font-semibold mb-1">
          Deal Rooms
        </h1>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-4">
          {side === "seller"
            ? "Negotiate moja kwa moja na wanunuzi wenye nia ya mali yako."
            : "Negotiate moja kwa moja na wauzaji wa mali unazovutiwa nazo."}
        </p>
      </div>

      <div className="flex" style={{ height: "560px" }}>
        {/* List pane */}
        <div
          style={{ borderColor: COLORS.sandLine }}
          className={`${mobileShowDetail ? "hidden" : "flex"} md:flex flex-col w-full md:w-80 shrink-0 border-r px-3 sm:px-4 pb-4 gap-2 overflow-y-auto`}
        >
          {deals.map((d) => (
            <DealListItem key={d.id} deal={d} active={d.id === selectedId} onSelect={handleSelect} />
          ))}
        </div>

        {/* Detail pane */}
        <div className={`${mobileShowDetail ? "flex" : "hidden"} md:flex flex-1 min-w-0 flex-col`}>
          {selectedDeal ? (
            <DealDetail
              deal={selectedDeal}
              side={side}
              onBack={() => setMobileShowDetail(false)}
              onSendMessage={handleSendMessage}
              onSendOffer={handleSendOffer}
              onRespond={handleRespond}
              onReserveConfirm={handleReserveConfirm}
              onInspectionResolve={handleInspectionResolve}
              onProofSubmit={handleProofSubmit}
              onProofConfirm={handleProofConfirm}
              onProofReject={handleProofReject}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p style={{ color: "rgba(16,26,46,0.45)" }} className="text-sm">
                Chagua deal room kuanza mazungumzo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
