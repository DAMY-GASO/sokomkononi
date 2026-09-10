
import React, { useState, useEffect } from "react";
import { Smartphone, CreditCard, Check, ChevronLeft, ShieldCheck, Loader2 } from "lucide-react";
import { COLORS, FONTS, PAYMENT_METHODS, formatTZS } from "./shared";

const inputStyle = {
  background: COLORS.sand,
  borderColor: COLORS.sandLine,
  color: COLORS.night,
};

function MethodOption({ method, selected, onSelect }) {
  const Icon = method.type === "card" ? CreditCard : Smartphone;
  return (
    <button
      onClick={() => onSelect(method.key)}
      style={{
        borderColor: selected ? COLORS.gold : COLORS.sandLine,
        background: selected ? "rgba(232,163,61,0.08)" : "white",
      }}
      className="flex items-center gap-3 p-3 rounded-xl border text-left transition-colors"
    >
      <div
        style={{ background: COLORS.night }}
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
      >
        <Icon size={16} color={COLORS.gold} />
      </div>
      <span style={{ color: COLORS.night }} className="text-sm font-medium flex-1">
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
 * Simulated payment step, unified for Listing Fee and Boost Sasa.
 *
 * This mocks the mobile-money / card UX for demo purposes. Wiring a real
 * provider (e.g. Selcom, ClickPesa, Flutterwave) means calling their API
 * from a backend endpoint that holds the provider credentials — never
 * from the browser — then confirming the charge via webhook before
 * calling onSuccess.
 */
export default function PaymentGateway({ amount, title, description, onSuccess, onCancel }) {
  const [methodKey, setMethodKey] = useState(null);
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [step, setStep] = useState("select"); // select | processing | success

  const method = PAYMENT_METHODS.find((m) => m.key === methodKey);

  const canPay =
    method &&
    (method.type === "mobile"
      ? phone.replace(/\D/g, "").length >= 9
      : card.number.replace(/\D/g, "").length >= 12 && card.expiry.length >= 4 && card.cvv.length >= 3);

  useEffect(() => {
    if (step !== "processing") return;
    const id = setTimeout(() => setStep("success"), 1900);
    return () => clearTimeout(id);
  }, [step]);

  const handlePay = () => {
    if (!canPay) return;
    setStep("processing");
  };

  if (step === "processing") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-8 text-center"
      >
        <Loader2 size={30} className="animate-spin mx-auto mb-4" color={COLORS.gold} />
        <p style={{ color: COLORS.night }} className="text-sm font-semibold mb-1.5">
          {method.type === "mobile" ? "Inasubiri uthibitisho..." : "Inachakata malipo..."}
        </p>
        <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs">
          {method.type === "mobile"
            ? `Angalia simu yako (${phone}) na ukamilishe ombi la ${method.label}.`
            : "Tafadhali subiri, tunathibitisha malipo yako ya kadi."}
        </p>
      </div>
    );
  }

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
        <p style={{ color: COLORS.night }} className="text-sm font-semibold mb-1">
          Malipo Yamefanikiwa
        </p>
        <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs mb-5">
          {formatTZS(amount)} kupitia {method.label}
        </p>
        <button
          onClick={onSuccess}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="w-full py-3 rounded-xl font-semibold text-sm"
        >
          Endelea
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-2xl border p-5"
    >
      <button
        onClick={onCancel}
        style={{ color: COLORS.night }}
        className="flex items-center gap-1 text-xs font-medium mb-3 opacity-70"
      >
        <ChevronLeft size={14} /> Rudi Nyuma
      </button>

      <div className="flex items-center justify-between mb-4">
        <span style={{ color: COLORS.night }} className="text-sm font-semibold">
          {title}
        </span>
        <span style={{ color: COLORS.rust }} className="text-lg font-bold">
          {formatTZS(amount)}
        </span>
      </div>
      {description && (
        <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs mb-4 -mt-2">
          {description}
        </p>
      )}

      <p style={{ color: COLORS.night }} className="text-xs font-semibold mb-2">
        Chagua Njia ya Malipo
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {PAYMENT_METHODS.map((m) => (
          <MethodOption key={m.key} method={m} selected={m.key === methodKey} onSelect={setMethodKey} />
        ))}
      </div>

      {method?.type === "mobile" && (
        <label className="flex flex-col gap-1.5 mb-4">
          <span style={{ color: COLORS.night }} className="text-xs font-medium">
            Namba ya Simu ({method.label})
          </span>
          <input
            style={inputStyle}
            className="rounded-xl border px-3 py-2.5 text-sm outline-none"
            placeholder="mfano: 0712 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
      )}

      {method?.type === "card" && (
        <div className="flex flex-col gap-3 mb-4">
          <label className="flex flex-col gap-1.5">
            <span style={{ color: COLORS.night }} className="text-xs font-medium">
              Namba ya Kadi
            </span>
            <input
              style={inputStyle}
              className="rounded-xl border px-3 py-2.5 text-sm outline-none"
              placeholder="0000 0000 0000 0000"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span style={{ color: COLORS.night }} className="text-xs font-medium">
                Muda wa Mwisho
              </span>
              <input
                style={inputStyle}
                className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                placeholder="MM/YY"
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span style={{ color: COLORS.night }} className="text-xs font-medium">
                CVV
              </span>
              <input
                style={inputStyle}
                className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                placeholder="123"
                value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value })}
              />
            </label>
          </div>
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={!canPay}
        style={{
          background: canPay ? COLORS.gold : COLORS.sandLine,
          color: canPay ? COLORS.night : "rgba(16,26,46,0.4)",
        }}
        className="w-full py-3 rounded-xl font-semibold text-sm mb-3"
      >
        Lipa {formatTZS(amount)}
      </button>

      <p
        style={{ color: "rgba(16,26,46,0.4)" }}
        className="flex items-start gap-1.5 text-[11px] leading-snug"
      >
        <ShieldCheck size={13} className="shrink-0 mt-0.5" />
        Huu ni mfumo wa maonyesho (demo). Muunganiko halisi na M-Pesa/Tigo Pesa/Airtel Money
        au kadi utafanywa kupitia provider kama Selcom au ClickPesa, kwa njia salama ya
        backend.
      </p>
    </div>
  );
}
