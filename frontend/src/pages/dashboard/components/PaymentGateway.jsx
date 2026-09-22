// ============================================================
// PaymentGateway.jsx — ⚠️ TEMP SIMULATION MODE ⚠️
//
// The real payment provider (M-Pesa / Mixx by Yas / Airtel Money /
// card) is NOT yet connected. To keep the rest of the flow working
// end-to-end (boost, leading, advertise, listing fee), this gateway
// auto-succeeds after a short delay and hands back a
// `SIMULATED-<timestamp>` reference to the parent.
//
// The parent still calls the real backend endpoints
// (e.g. POST /listings/{id}/fee/pay/, POST /boosting/{id}/pay/),
// so all non-payment data stays consistent in the DB.
//
// TODO: REMOVE WHEN READY
//   - Delete the `setTimeout` block in `handlePay`
//   - Set `PROVIDER_WIRED_UP = true`
//   - The submit path already awaits `onSubmit(...)` so no other
//     changes are needed — the parent will do the real call.
// ============================================================
import React, { useState } from "react";
import {
  Smartphone,
  CreditCard,
  Check,
  ChevronLeft,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { COLORS, PAYMENT_METHODS, formatTZS } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";

// ── Flip to true once the backend + provider are integrated ──
const PROVIDER_WIRED_UP = false;

const SIMULATION_DELAY_MS = 1500;

const inputStyle = {
  background: COLORS.sand,
  borderColor: COLORS.sandLine,
  color: COLORS.night,
};

function formatPhoneInput(value) {
  const digits = String(value).replace(/[^0-9]/g, "").slice(0, 10);
  if (!digits) return "";
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}
function formatCardInput(value) {
  const digits = String(value).replace(/[^0-9]/g, "").slice(0, 16);
  if (!digits) return "";
  return digits.replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiryInput(value) {
  const digits = String(value).replace(/[^0-9]/g, "").slice(0, 4);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function MethodOption({ method, selected, onSelect, disabled }) {
  const Icon = method.type === "card" ? CreditCard : Smartphone;
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(method.key)}
      disabled={disabled}
      style={{
        borderColor: selected ? COLORS.gold : COLORS.sandLine,
        background: selected ? "rgba(232,163,61,0.08)" : "white",
      }}
      className="flex items-center justify-center gap-3 p-3 rounded-xl border text-center transition-colors disabled:opacity-50"
    >
      <div
        style={{ background: COLORS.night }}
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
      >
        <Icon size={16} color={COLORS.gold} />
      </div>
      <span className="text-primary text-sm font-medium flex-1 text-center">
        {method.label}
      </span>
      <span
        style={{
          background: selected ? COLORS.gold : "transparent",
          borderColor: COLORS.gold,
        }}
        className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
      >
        {selected && <Check size={12} color={COLORS.night} />}
      </span>
    </button>
  );
}

export default function PaymentGateway({
  amount,
  title,
  description,
  /**
   * onSubmit({ method, methodLabel, phone, card, reference }) →
   *   Promise<{ ok, error?, data? }>
   * Parent MUST call the real backend "pay" endpoint here.
   * In simulation mode we just pass a fake reference; the parent
   * still hits the backend so the DB stays in sync.
   */
  onSubmit,
  onSuccess,
  onCancel,
  /** Optional: force the user to paste a telco reference */
  requireReference = false,
  referenceLabel,
}) {
  const { lang } = useLanguage();
  const [methodKey, setMethodKey] = useState(null);
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [reference, setReference] = useState("");
  const [stage, setStage] = useState("select"); // select | processing | done
  const [error, setError] = useState("");
  const [finalReference, setFinalReference] = useState(null);

  const method = PAYMENT_METHODS.find((m) => m.key === methodKey);

  const phoneOk =
    method?.type === "mobile" && phone.replace(/\D/g, "").length >= 9;
  const cardOk =
    method?.type === "card" &&
    card.number.replace(/\D/g, "").length >= 12 &&
    card.expiry.length >= 4 &&
    card.cvv.length >= 3;
  const refOk = !requireReference || reference.trim().length > 0;
  const canPay =
    Boolean(method) && (phoneOk || cardOk) && refOk && stage === "select";

  const handlePay = async () => {
    if (!canPay || !onSubmit) return;
    setStage("processing");
    setError("");

    // ── TEMP SIMULATION ─────────────────────────────────────
    // Wait a beat so the UX feels like a real provider round-trip,
    // then fabricate a reference the parent can pass to the backend.
    if (!PROVIDER_WIRED_UP) {
      await new Promise((r) => setTimeout(r, SIMULATION_DELAY_MS));
    }
    // ────────────────────────────────────────────────────────

    const simulatedRef = `SIMULATED-${Date.now()}`;
    const referenceToSend = reference.trim() || simulatedRef;

    try {
      const res = await onSubmit({
        method: method.key,
        methodLabel: method.label,
        phone: method.type === "mobile" ? phone.replace(/\s/g, "") : null,
        card: method.type === "card" ? card : null,
        reference: referenceToSend,
        simulated: !PROVIDER_WIRED_UP,
      });

      if (!res || res.ok === false) {
        setError(
          res?.error?.message ||
            res?.error?.data?.detail ||
            (lang === "sw"
              ? "Hatua inayofuata imeshindikana. Jaribu tena."
              : "Next step failed. Please try again.")
        );
        setStage("select");
        return;
      }

      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }

      setFinalReference(referenceToSend);
      setStage("done");
      onSuccess?.(res.data);
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          (lang === "sw" ? "Hitilafu ya mtandao." : "Network error.")
      );
      setStage("select");
    }
  };

  // ── PROCESSING ───────────────────────────────────────────
  if (stage === "processing") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-8 text-center"
      >
        <Loader2
          size={30}
          className="animate-spin mx-auto mb-4"
          color={COLORS.gold}
        />
        <p className="text-primary text-sm font-semibold mb-1.5">
          {method?.type === "mobile"
            ? lang === "sw"
              ? "Inasubiri uthibitisho..."
              : "Waiting for confirmation..."
            : lang === "sw"
              ? "Inachakata malipo..."
              : "Processing payment..."}
        </p>
        <p className="text-secondary text-body-sm">
          {method?.type === "mobile"
            ? lang === "sw"
              ? `Angalia simu yako (${phone}) na ukamilishe ombi la ${method.label}.`
              : `Check your phone (${phone}) and complete the ${method.label} request.`
            : lang === "sw"
              ? "Tafadhali subiri, tunathibitisha malipo yako."
              : "Please wait, we're confirming your payment."}
        </p>
      </div>
    );
  }

  // ── SUCCESS ──────────────────────────────────────────────
  if (stage === "done") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-8 text-center"
      >
        <div
          style={{ background: COLORS.green }}
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
        >
          <Check color="white" size={22} />
        </div>
        <p className="text-primary text-sm font-semibold mb-1">
          {lang === "sw" ? "Imekamilika" : "Completed"}
        </p>
        <p className="text-secondary text-body-sm mb-3">
          {formatTZS(amount)}{" "}
          {lang === "sw" ? "kupitia" : "via"} {method?.label}
        </p>
        {finalReference && (
          <p className="text-[11px] text-muted font-mono mb-5">
            {lang === "sw" ? "Kumbukumbu" : "Reference"}: {finalReference}
          </p>
        )}
      </div>
    );
  }

  // ── SELECT ───────────────────────────────────────────────
  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-2xl border p-5"
    >
      <div className="flex justify-center mb-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-primary flex items-center gap-1 text-body-sm font-medium opacity-70"
        >
          <ChevronLeft size={14} />{" "}
          {lang === "sw" ? "Rudi Nyuma" : "Back"}
        </button>
      </div>

      <div className="flex flex-col items-center text-center gap-1 mb-4">
        <span className="text-primary text-sm font-semibold">{title}</span>
        <span style={{ color: COLORS.rust }} className="text-lg font-bold">
          {formatTZS(amount)}
        </span>
      </div>

      {description && (
        <p className="text-secondary text-body-sm mb-4 text-center">
          {description}
        </p>
      )}

      {/* ⚠️ SIMULATION NOTICE */}
      {!PROVIDER_WIRED_UP && (
        <div
          style={{
            background: "rgba(232,163,61,0.12)",
            color: "#8A5A16",
            borderColor: "rgba(232,163,61,0.35)",
          }}
          className="flex items-start gap-2 text-body-sm rounded-lg border px-3 py-2.5 mb-4"
        >
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            {lang === "sw"
              ? "Malipo yanafanyika kwa hali ya majaribio (simulation). Ukibofya 'Lipa', mfumo utakamilisha hatua inayofuata papo hapo. Malipo halisi hayatozwi bado."
              : "Payments are in simulation mode. Clicking 'Pay' will complete the next step instantly. No real money is charged yet."}
          </span>
        </div>
      )}

      <p className="text-primary text-body-sm font-semibold mb-2 text-center">
        {lang === "sw" ? "Chagua Njia ya Malipo" : "Choose Payment Method"}
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {PAYMENT_METHODS.map((m) => (
          <MethodOption
            key={m.key}
            method={m}
            selected={m.key === methodKey}
            onSelect={setMethodKey}
          />
        ))}
      </div>

      {method?.type === "mobile" && (
        <label className="flex flex-col gap-1.5 mb-4 text-center">
          <span className="text-primary text-body-sm font-medium">
            {lang === "sw" ? "Namba ya Simu" : "Phone Number"} ({method.label})
          </span>
          <input
            style={inputStyle}
            type="text"
            inputMode="tel"
            className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
            placeholder={
              lang === "sw" ? "mfano: 0712 345 678" : "e.g. 0712 345 678"
            }
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          />
        </label>
      )}

      {method?.type === "card" && (
        <div className="flex flex-col gap-3 mb-4">
          <label className="flex flex-col gap-1.5 text-center">
            <span className="text-primary text-body-sm font-medium">
              {lang === "sw" ? "Namba ya Kadi" : "Card Number"}
            </span>
            <input
              style={inputStyle}
              type="text"
              inputMode="numeric"
              className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center tracking-wider"
              placeholder="0000 0000 0000 0000"
              value={card.number}
              onChange={(e) =>
                setCard({ ...card, number: formatCardInput(e.target.value) })
              }
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-center">
              <span className="text-primary text-body-sm font-medium">
                {lang === "sw" ? "Muda wa Mwisho" : "Expiry"}
              </span>
              <input
                style={inputStyle}
                type="text"
                inputMode="numeric"
                className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                placeholder="MM/YY"
                value={card.expiry}
                onChange={(e) =>
                  setCard({
                    ...card,
                    expiry: formatExpiryInput(e.target.value),
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1.5 text-center">
              <span className="text-primary text-body-sm font-medium">
                CVV
              </span>
              <input
                style={inputStyle}
                type="text"
                inputMode="numeric"
                className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
                placeholder="123"
                value={card.cvv}
                onChange={(e) =>
                  setCard({
                    ...card,
                    cvv: e.target.value.replace(/[^0-9]/g, "").slice(0, 4),
                  })
                }
              />
            </label>
          </div>
        </div>
      )}

      {requireReference && (
        <label className="flex flex-col gap-1.5 mb-4 text-center">
          <span className="text-primary text-body-sm font-medium">
            {referenceLabel ||
              (lang === "sw"
                ? "Namba ya muamala (hiari — itatengenezwa kwa simulation)"
                : "Transaction number (optional — will be simulated)")}
          </span>
          <input
            style={inputStyle}
            type="text"
            className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center font-mono"
            placeholder="SIMULATED"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </label>
      )}

      {error && (
        <div
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          className="rounded-lg px-3 py-2 mb-3 text-xs text-center flex items-center justify-center gap-1.5"
        >
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={!canPay}
        style={{
          background: canPay ? COLORS.gold : COLORS.sandLine,
          color: canPay ? COLORS.night : "rgba(16,26,46,0.4)",
        }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm mb-3 disabled:cursor-not-allowed"
      >
        {lang === "sw"
          ? `Lipa ${formatTZS(amount)}`
          : `Pay ${formatTZS(amount)}`}
      </button>

      <p className="text-muted flex items-start justify-center gap-1.5 text-body-sm leading-snug text-center">
        <ShieldCheck size={13} className="shrink-0 mt-0.5" />
        <span>
          {lang === "sw"
            ? "Hii ni simulation. Uunganishaji halisi wa M-Pesa/Mixx by Yas/Airtel Money utawekwa baadaye."
            : "This is a simulation. Real M-Pesa/Mixx by Yas/Airtel Money integration will be added later."}
        </span>
      </p>
    </div>
  );
}
