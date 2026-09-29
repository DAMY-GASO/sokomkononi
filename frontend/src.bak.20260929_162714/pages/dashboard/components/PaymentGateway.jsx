// ============================================================
// PaymentGateway.jsx — FimiPay integration
//
// Flow:
//   1. User picks method + enters phone (mobile) or leaves blank (card)
//   2. We call parent's onInitiate({ methodKey, methodLabel, phone })
//      Parent hits the appropriate /pay/ endpoint on the backend
//   3. Parent returns { ok, orderId, gatewayUrl, simulated, environment }
//   4. If gatewayUrl → redirect user there (card/bank)
//      Else → poll /payments/order-status/ until terminal
//   5. On SUCCESS → call onSuccess(data)
// ============================================================
import React, { useState, useEffect, useRef } from "react";
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
import { paymentsApi } from "../../../api/payments.js";

const PAY_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 225; // ~15 minutes

const TERMINAL_FAILURES = new Set([
  "CANCELLED",
  "USERCANCELLED",
  "REJECTED",
  "FAILED",
]);

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
  onInitiate,
  onSuccess,
  onCancel,
}) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [methodKey, setMethodKey] = useState(null);
  const [phone, setPhone] = useState("");
  // stage: select | initiating | polling | redirecting | done | error
  const [stage, setStage] = useState("select");
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [simulated, setSimulated] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [finalRef, setFinalRef] = useState("");
  const [finalData, setFinalData] = useState(null);

  const cancelledRef = useRef(false);
  const pollTimerRef = useRef(null);

  const method = PAYMENT_METHODS.find((m) => m.key === methodKey);
  const phoneOk = method?.type === "mobile" && phone.replace(/\D/g, "").length >= 9;
  const canPay =
    Boolean(method) &&
    (method.type === "card" ? true : phoneOk) &&
    stage === "select";

  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    },
    []
  );

  // Resume a pending order after refresh / re-navigation.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("sokomkononi_pending_payment_order");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved?.orderId) return;
      if (saved.amount && amount && saved.amount !== amount) return;
      if (Date.now() - (saved.startedAt || 0) > 60 * 60 * 1000) {
        window.localStorage.removeItem("sokomkononi_pending_payment_order");
        return;
      }
      setOrderId(saved.orderId);
      setStage("polling");
      runPolling(saved.orderId);
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------
  // Polling
  // ------------------------------------------------------------
  const runPolling = async (orderId) => {
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      if (cancelledRef.current) return;
      await new Promise((resolve) => {
        pollTimerRef.current = setTimeout(resolve, PAY_INTERVAL_MS);
      });
      if (cancelledRef.current) return;
      setAttempt(i + 1);

      let data;
      try {
        data = await paymentsApi.orderStatus(orderId);
      } catch {
        // network blip — try again on next tick
        continue;
      }

      const s = String(data?.payment_status || "").toUpperCase();
      if (s === "SUCCESS") {
        setFinalRef(data?.transid || data?.order_id || "");
        setFinalData(data);
        setStage("done");
        try { window.localStorage.removeItem("sokomkononi_pending_payment_order"); }
        catch { /* noop */ }
        onSuccess?.(data);
        return;
      }
      if (TERMINAL_FAILURES.has(s)) {
        setError(
          s === "USERCANCELLED"
            ? t(
                "Ulikataa ombi kwenye simu yako.",
                "You declined the prompt on your phone."
              )
            : s === "CANCELLED"
              ? t("Malipo yameghairiwa.", "Payment was cancelled.")
              : s === "REJECTED"
                ? t(
                    "Malipo yamekataliwa na mtoa huduma.",
                    "Payment was rejected by the provider."
                  )
                : t("Malipo hayakufanikiwa.", "Payment did not succeed.")
        );
        setStage("error");
        return;
      }
      // PENDING / INPROGRESS → continue
    }
    setError(
      t(
        "Malipo hayajathibitishwa kwa muda uliopangwa. Jaribu tena.",
        "Payment was not confirmed in time. Please try again."
      )
    );
    setStage("error");
  };

  // ------------------------------------------------------------
  // Initiate + (redirect OR poll)
  // ------------------------------------------------------------
  const handlePay = async () => {
    if (!canPay) return;
    if (!onInitiate) {
      setError("Payment handler missing.");
      return;
    }
    setStage("initiating");
    setError("");

    const cleanPhone = phone.replace(/\s/g, "");
    let res;
    try {
      res = await onInitiate({
        methodKey: method.key,
        methodLabel: method.label,
        phone: method.type === "mobile" ? cleanPhone : null,
      });
    } catch (err) {
      setError(
        err?.data?.detail || err?.message || t("Hitilafu ya mtandao.", "Network error.")
      );
      setStage("error");
      return;
    }

    if (!res || res.ok === false) {
      setError(
        res?.error?.data?.detail ||
          res?.error?.data?.message ||
          res?.error?.message ||
          t("Hatua ya malipo imeshindikana.", "Payment step failed.")
      );
      setStage("error");
      return;
    }

    setOrderId(res.orderId || "");
    setSimulated(Boolean(res.simulated));
    // Persist so a refresh does not orphan the pending order.
    try {
      if (res.orderId) {
        window.localStorage.setItem(
          "sokomkononi_pending_payment_order",
          JSON.stringify({
            orderId: res.orderId,
            startedAt: Date.now(),
            amount,
            title,
          })
        );
      }
    } catch { /* noop */ }

    // Card/bank → redirect to FimiPay hosted page
    if (res.gatewayUrl) {
      setStage("redirecting");
      setTimeout(() => {
        window.location.href = res.gatewayUrl;
      }, 600);
      return;
    }

    // ------------------------------------------------------------
    // Instant success — the backend may return a reused order that
    // is already SUCCESS (e.g. SOKO_FIMIPAY_TEST_OUTCOME=success,
    // or a user who already paid but the resource wasn't updated).
    // In that case skip polling entirely.
    // ------------------------------------------------------------
    if (String(res.paymentStatus || "").toUpperCase() === "SUCCESS") {
      setFinalRef(res.transid || res.orderId || "");
      setFinalData(res);
      setStage("done");
      onSuccess?.(res);
      return;
    }

    // Terminal failure on initiate — no point polling
    if (["CANCELLED", "USERCANCELLED", "REJECTED", "FAILED"].includes(
      String(res.paymentStatus || "").toUpperCase()
    )) {
      setError(
        t(
          "Malipo yalikataliwa au yalighairiwa. Jaribu tena.",
          "Payment was rejected or cancelled. Please try again."
        )
      );
      setStage("error");
      return;
    }

    // Mobile → start polling
    if (!res.orderId) {
      setError(
        t(
          "Backend haikurudisha order_id. Wasiliana na msaada.",
          "Backend did not return an order_id. Contact support."
        )
      );
      setStage("error");
      return;
    }
    setStage("polling");
    runPolling(res.orderId);
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    try { window.localStorage.removeItem("sokomkononi_pending_payment_order"); }
    catch { /* noop */ }
    onCancel?.();
  };

  const handleRetry = () => {
    cancelledRef.current = false;
    setError("");
    setStage("select");
    setAttempt(0);
    setOrderId(null);
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
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
          {t("Malipo Yamefanikiwa", "Payment Successful")}
        </p>
        <p className="text-secondary text-body-sm mb-3">
          {formatTZS(amount)} {lang === "sw" ? "kupitia" : "via"} {method?.label}
        </p>
        {finalRef && (
          <p className="text-[11px] text-muted font-mono mb-4">
            {t("Kumbukumbu", "Reference")}: {finalRef}
          </p>
        )}
        {simulated && (
          <span
            className="inline-block text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: "rgba(232,163,61,0.15)", color: "#8A5A16" }}
          >
            TEST MODE
          </span>
        )}
      </div>
    );
  }

  if (stage === "redirecting") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-8 text-center"
      >
        <Loader2 size={28} className="animate-spin mx-auto mb-3" color={COLORS.gold} />
        <p className="text-primary text-sm font-semibold">
          {t(
            "Unahamishwa kwenye ukurasa wa malipo...",
            "Redirecting to payment page..."
          )}
        </p>
      </div>
    );
  }

  if (stage === "initiating") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-8 text-center"
      >
        <Loader2 size={28} className="animate-spin mx-auto mb-3" color={COLORS.gold} />
        <p className="text-primary text-sm font-semibold">
          {t("Inaanzisha malipo...", "Starting payment...")}
        </p>
      </div>
    );
  }

  if (stage === "polling") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-6 text-center"
      >
        {simulated && (
          <div
            className="rounded-lg px-3 py-2 mb-3 text-[11px] font-semibold"
            style={{ background: "rgba(232,163,61,0.12)", color: "#8A5A16" }}
          >
            TEST MODE — {t("Hakuna pesa halisi inayotolewa", "No real money is charged")}
          </div>
        )}
        <div
          style={{ background: `${COLORS.gold}20` }}
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Smartphone size={24} color={COLORS.gold} />
        </div>
        <p className="text-primary text-sm font-semibold mb-1">
          {t("Angalia simu yako", "Check your phone")}
        </p>
        <p className="text-secondary text-body-sm mb-4 max-w-md mx-auto">
          {t(
            `Tumetuma ombi la malipo kwa ${method?.label}. Idhinisha kwa kuingiza PIN yako.`,
            `We sent a payment request via ${method?.label}. Approve by entering your PIN.`
          )}
        </p>
        <div className="flex items-center justify-center gap-2 text-body-sm text-secondary mb-4">
          <Loader2 size={14} className="animate-spin" />
          {t("Inasubiri uthibitisho...", "Waiting for confirmation...")}
          <span className="text-muted">
            ({attempt}/{MAX_POLL_ATTEMPTS})
          </span>
        </div>
        {orderId && (
          <p className="text-[10px] text-muted font-mono mb-4">
            {t("Order", "Order")}: {orderId}
          </p>
        )}
        <button
          onClick={handleCancel}
          className="text-xs font-medium text-secondary hover:text-primary underline"
        >
          {t("Ghairi", "Cancel")}
        </button>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-6 text-center"
      >
        <div
          style={{ background: "rgba(193,80,46,0.12)" }}
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
        >
          <AlertTriangle size={22} color={COLORS.rust} />
        </div>
        <p className="text-primary text-sm font-semibold mb-1">
          {t("Malipo Hayakufanikiwa", "Payment Failed")}
        </p>
        <p className="text-secondary text-body-sm mb-4">{error}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-secondary"
          >
            {t("Ghairi", "Cancel")}
          </button>
          <button
            onClick={handleRetry}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          >
            {t("Jaribu Tena", "Try Again")}
          </button>
        </div>
      </div>
    );
  }

  // SELECT (default)
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
          <ChevronLeft size={14} /> {t("Rudi Nyuma", "Back")}
        </button>
      </div>

      <div className="flex flex-col items-center text-center gap-1 mb-4">
        <span className="text-primary text-sm font-semibold">{title}</span>
        <span style={{ color: COLORS.rust }} className="text-lg font-bold">
          {formatTZS(amount)}
        </span>
      </div>

      {description && (
        <p className="text-secondary text-body-sm mb-4 text-center">{description}</p>
      )}

      <p className="text-primary text-body-sm font-semibold mb-2 text-center">
        {t("Chagua Njia ya Malipo", "Choose Payment Method")}
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
            {t("Namba ya Simu", "Phone Number")} ({method.label})
          </span>
          <input
            style={inputStyle}
            type="text"
            inputMode="tel"
            className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
            placeholder={t("mfano: 0712 345 678", "e.g. 0712 345 678")}
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
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
        {lang === "sw" ? `Lipa ${formatTZS(amount)}` : `Pay ${formatTZS(amount)}`}
      </button>

      <p className="text-muted flex items-start justify-center gap-1.5 text-body-sm leading-snug text-center">
        <ShieldCheck size={13} className="shrink-0 mt-0.5" />
        <span>
          {lang === "sw"
            ? "Malipo yako yanalindwa. Usitoe PIN yako kwa mtu yeyote."
            : "Your payment is secure. Never share your PIN with anyone."}
        </span>
      </p>
    </div>
  );
}
