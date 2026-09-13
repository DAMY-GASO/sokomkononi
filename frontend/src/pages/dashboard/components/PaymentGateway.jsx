import React, { useState, useEffect } from "react";
import {
  Smartphone,
  CreditCard,
  Check,
  ChevronLeft,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { COLORS, FONTS, PAYMENT_METHODS, formatTZS } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";

const inputStyle = {
  background: COLORS.sand,
  borderColor: COLORS.sandLine,
  color: COLORS.night,
};

// ============================================================
// HELPERS — input formatting (phone, card, expiry)
// ============================================================
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

// ============================================================
// METHOD OPTION — centered (icon + label + check)
// ============================================================
function MethodOption({ method, selected, onSelect }) {
  const Icon = method.type === "card" ? CreditCard : Smartphone;
  return (
    <button
      onClick={() => onSelect(method.key)}
      style={{
        borderColor: selected ? COLORS.gold : COLORS.sandLine,
        background: selected ? "rgba(232,163,61,0.08)" : "white",
      }}
      className="flex items-center justify-center gap-3 p-3 rounded-xl border text-center transition-colors"
    >
      <div
        style={{ background: COLORS.night }}
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
      >
        <Icon size={16} color={COLORS.gold} />
      </div>
      <span
        style={{ color: COLORS.night }}
        className="text-sm font-medium flex-1 text-center"
      >
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

/**
 * Simulated payment step, unified for Listing Fee, Boost, Leading,
 * Advertisement, and Reservation Fee.
 *
 * KILA KITU CENTERED + bilingual kamili.
 */
export default function PaymentGateway({
  amount,
  title,
  description,
  onSuccess,
  onCancel,
}) {
  const { lang } = useLanguage();
  const [methodKey, setMethodKey] = useState(null);
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [step, setStep] = useState("select"); // select | processing | success

  const method = PAYMENT_METHODS.find((m) => m.key === methodKey);

  const canPay =
    method &&
    (method.type === "mobile"
      ? phone.replace(/\D/g, "").length >= 9
      : card.number.replace(/\D/g, "").length >= 12 &&
        card.expiry.length >= 4 &&
        card.cvv.length >= 3);

  useEffect(() => {
    if (step !== "processing") return;
    const id = setTimeout(() => setStep("success"), 1900);
    return () => clearTimeout(id);
  }, [step]);

  const handlePay = () => {
    if (!canPay) return;
    setStep("processing");
  };

  // ============================================================
  // PROCESSING STATE
  // ============================================================
  if (step === "processing") {
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
        <p
          style={{ color: COLORS.night }}
          className="text-sm font-semibold mb-1.5"
        >
          {method.type === "mobile"
            ? lang === "sw"
              ? "Inasubiri uthibitisho..."
              : "Waiting for confirmation..."
            : lang === "sw"
              ? "Inachakata malipo..."
              : "Processing payment..."}
        </p>
        <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs">
          {method.type === "mobile"
            ? lang === "sw"
              ? `Angalia simu yako (${phone}) na ukamilishe ombi la ${method.label}.`
              : `Check your phone (${phone}) and complete the ${method.label} request.`
            : lang === "sw"
              ? "Tafadhali subiri, tunathibitisha malipo yako ya kadi."
              : "Please wait, we're confirming your card payment."}
        </p>
      </div>
    );
  }

  // ============================================================
  // SUCCESS STATE
  // ============================================================
  if (step === "success") {
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
        <p
          style={{ color: COLORS.night }}
          className="text-sm font-semibold mb-1"
        >
          {lang === "sw" ? "Malipo Yamefanikiwa" : "Payment Successful"}
        </p>
        <p
          style={{ color: "rgba(16,26,46,0.55)" }}
          className="text-xs mb-5"
        >
          {formatTZS(amount)}{" "}
          {lang === "sw" ? "kupitia" : "via"} {method.label}
        </p>
        <button
          onClick={onSuccess}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="w-full py-3 rounded-xl font-semibold text-sm"
        >
          {lang === "sw" ? "Endelea" : "Continue"}
        </button>
      </div>
    );
  }

  // ============================================================
  // SELECT STATE — KILA KITU CENTERED
  // ============================================================
  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-2xl border p-5"
    >
      {/* Back button — centered */}
      <div className="flex justify-center mb-3">
        <button
          onClick={onCancel}
          style={{ color: COLORS.night }}
          className="flex items-center gap-1 text-xs font-medium opacity-70"
        >
          <ChevronLeft size={14} />{" "}
          {lang === "sw" ? "Rudi Nyuma" : "Back"}
        </button>
      </div>

      {/* Title + Amount — centered */}
      <div className="flex flex-col items-center text-center gap-1 mb-4">
        <span
          style={{ color: COLORS.night }}
          className="text-sm font-semibold"
        >
          {title}
        </span>
        <span style={{ color: COLORS.rust }} className="text-lg font-bold">
          {formatTZS(amount)}
        </span>
      </div>

      {description && (
        <p
          style={{ color: "rgba(16,26,46,0.55)" }}
          className="text-xs mb-4 text-center"
        >
          {description}
        </p>
      )}

      {/* Method label — centered */}
      <p
        style={{ color: COLORS.night }}
        className="text-xs font-semibold mb-2 text-center"
      >
        {lang === "sw" ? "Chagua Njia ya Malipo" : "Choose Payment Method"}
      </p>

      {/* Methods — kila kitu centered */}
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

      {/* Mobile phone input — centered */}
      {method?.type === "mobile" && (
        <label className="flex flex-col gap-1.5 mb-4 text-center">
          <span
            style={{ color: COLORS.night }}
            className="text-xs font-medium"
          >
            {lang === "sw" ? "Namba ya Simu" : "Phone Number"} (
            {method.label})
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

      {/* Card inputs — centered */}
      {method?.type === "card" && (
        <div className="flex flex-col gap-3 mb-4">
          <label className="flex flex-col gap-1.5 text-center">
            <span
              style={{ color: COLORS.night }}
              className="text-xs font-medium"
            >
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
                setCard({
                  ...card,
                  number: formatCardInput(e.target.value),
                })
              }
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-center">
              <span
                style={{ color: COLORS.night }}
                className="text-xs font-medium"
              >
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
              <span
                style={{ color: COLORS.night }}
                className="text-xs font-medium"
              >
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

      {/* Pay button — centered */}
      <button
        onClick={handlePay}
        disabled={!canPay}
        style={{
          background: canPay ? COLORS.gold : COLORS.sandLine,
          color: canPay ? COLORS.night : "rgba(16,26,46,0.4)",
        }}
        className="w-full py-3 rounded-xl font-semibold text-sm mb-3 disabled:cursor-not-allowed"
      >
        {lang === "sw"
          ? `Lipa ${formatTZS(amount)}`
          : `Pay ${formatTZS(amount)}`}
      </button>

      {/* Security note — centered */}
      <p
        style={{ color: "rgba(16,26,46,0.4)" }}
        className="flex items-start justify-center gap-1.5 text-[11px] leading-snug text-center"
      >
        <ShieldCheck size={13} className="shrink-0 mt-0.5" />
        <span>
          {lang === "sw"
            ? "Huu ni mfumo wa maonyesho (demo). Muunganiko halisi na M-Pesa/Mixx by Yas/Airtel Money au kadi utafanywa kupitia provider kama Selcom au ClickPesa, kwa njia salama ya backend."
            : "This is a demo. Real integration with M-Pesa/Mixx by Yas/Airtel Money or cards will be done via a provider like Selcom or ClickPesa, using a secure backend."}
        </span>
      </p>
    </div>
  );
}
