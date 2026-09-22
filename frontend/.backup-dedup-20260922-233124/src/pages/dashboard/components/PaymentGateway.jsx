// ============================================================
// PaymentGateway.jsx (production)
// - Collects phone / card details + optional payment_reference
// - Calls props.onSubmit({ method, phone, reference }) → parent
//   does the real backend call (e.g. /listings/{id}/fee/pay/).
// - Shows real backend success or error. NO setTimeout simulation.
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
} from "lucide-react";
import { COLORS, PAYMENT_METHODS, formatTZS } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";

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
   * onSubmit({ method, phone, card, reference }) → Promise<{ok, error?, data?}>
   * Parent MUST call the real backend endpoint here.
   */
  onSubmit,
  onSuccess,
  onCancel,
  /**
   * Set true if the parent cannot process payment inline and needs
   * to redirect (e.g. hosted checkout). Then onSubmit returns
   * { ok: true, redirectUrl } and the gateway navigates.
   */
  allowRedirect = true,
  /** Optional: require the user to paste a telco reference before submit */
  requireReference = false,
  referenceLabel,
}) {
  const { lang } = useLanguage();
  const [methodKey, setMethodKey] = useState(null);
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const method = PAYMENT_METHODS.find((m) => m.key === methodKey);

  const phoneOk = method?.type === "mobile" && phone.replace(/\D/g, "").length >= 9;
  const cardOk =
    method?.type === "card" &&
    card.number.replace(/\D/g, "").length >= 12 &&
    card.expiry.length >= 4 &&
    card.cvv.length >= 3;
  const refOk = !requireReference || reference.trim().length > 0;
  const canPay = Boolean(method) && (phoneOk || cardOk) && refOk && !busy;

  const handlePay = async () => {
    if (!canPay || !onSubmit) return;
    setBusy(true);
    setError("");

    try {
      const res = await onSubmit({
        method: method.key,
        methodLabel: method.label,
        phone: method.type === "mobile" ? phone.replace(/\s/g, "") : null,
        card: method.type === "card" ? card : null,
        reference: reference.trim() || null,
      });

      if (!res || res.ok === false) {
        setError(
          res?.error?.message ||
            res?.error?.data?.detail ||
            (lang === "sw"
              ? "Malipo yameshindikana. Jaribu tena."
              : "Payment failed. Please try again.")
        );
        return;
      }

      if (res.redirectUrl && allowRedirect) {
        window.location.href = res.redirectUrl;
        return;
      }

      setDone(true);
      onSuccess?.(res.data);
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          (lang === "sw" ? "Hitilafu ya mtandao." : "Network error.")
      );
    } finally {
      setBusy(false);
    }
  };

  if (done) {
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
          {lang === "sw" ? "Malipo Yamefanikiwa" : "Payment Successful"}
        </p>
        <p className="text-secondary text-body-sm mb-5">
          {formatTZS(amount)}{" "}
          {lang === "sw" ? "kupitia" : "via"} {method?.label}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-2xl border p-5"
    >
      <div className="flex justify-center mb-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="text-primary flex items-center gap-1 text-body-sm font-medium opacity-70 disabled:opacity-40"
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
            disabled={busy}
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
            disabled={busy}
            className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center disabled:opacity-50"
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
              disabled={busy}
              className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center tracking-wider disabled:opacity-50"
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
                disabled={busy}
                className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center disabled:opacity-50"
                placeholder="MM/YY"
                value={card.expiry}
                onChange={(e) =>
                  setCard({ ...card, expiry: formatExpiryInput(e.target.value) })
                }
              />
            </label>
            <label className="flex flex-col gap-1.5 text-center">
              <span className="text-primary text-body-sm font-medium">CVV</span>
              <input
                style={inputStyle}
                type="text"
                inputMode="numeric"
                disabled={busy}
                className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center disabled:opacity-50"
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
                ? "Namba ya muamala / Reference"
                : "Transaction / Reference")}
          </span>
          <input
            style={inputStyle}
            type="text"
            disabled={busy}
            className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center font-mono disabled:opacity-50"
            placeholder="e.g. QGH7X92K1"
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
        {busy ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {lang === "sw" ? "Inatuma..." : "Submitting..."}
          </>
        ) : (
          lang === "sw" ? `Lipa ${formatTZS(amount)}` : `Pay ${formatTZS(amount)}`
        )}
      </button>

      <p className="text-muted flex items-start justify-center gap-1.5 text-body-sm leading-snug text-center">
        <ShieldCheck size={13} className="shrink-0 mt-0.5" />
        <span>
          {lang === "sw"
            ? "Malipo yanafanyika kwa njia salama ya backend. Uthibitisho unatoka kwa payment provider halisi."
            : "Payments are processed securely by the backend. Confirmation comes from the real payment provider."}
        </span>
      </p>
    </div>
  );
}
