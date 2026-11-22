import React, { useEffect, useState } from "react";
import { COLORS, formatTZS } from "../shared";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { PAYMENT_METHODS, formatHours } from "./dealStatus.js";
import { calcReservationFee, useActiveReservationTiers, useReservationSettings } from "../../../../config/feePolicy.js";
import { checkCredit } from "../../../../config/userCreditsStore.js";
import { cleanCardInput, cleanPhoneInput, isBankMethod, isMobileMoneyMethod } from "./paymentInputHelpers.js";

// ============================================================
// RESERVATION MODAL
// ============================================================
export default function ReservationModal({ open, onClose, deal, lang, user, onConfirm }) {
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
