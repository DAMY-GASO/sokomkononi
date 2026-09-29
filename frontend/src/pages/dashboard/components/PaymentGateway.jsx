// ============================================================
// PaymentGateway.jsx — FimiPay mobile-money + card integration
//
// Flow (per FimiPay docs, "currency + payment_method select the rail"):
//   1. User picks Mobile Money or Card/Bank
//   2. Mobile → user enters phone, we send { payment_method, phone }
//      Card  → we send { payment_method }, backend returns gateway URL
//   3. Card  → redirect to fimipay hosted checkout
//      Mobile → poll order-status every 4s
//   4. Terminal success → onSuccess(); failure → retry UI
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone, CreditCard, Building2, Check, ChevronLeft,
  ShieldCheck, Loader2, AlertTriangle, ExternalLink,
} from "lucide-react";
import { COLORS, formatTZS } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import {
  paymentsApi,
  MOBILE_METHODS,
  CARD_METHODS,
  isMobileMethod,
  isCardMethod,
  normalizeTzPhone,
  isValidTzPhone,
  TERMINAL_FAILURE,
} from "../../../api/payments.js";

// ── Spec constants ──────────────────────────────────────────
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 30;      // ~2 minutes
const SESSION_ORDER_KEY    = "pending_order_id";
const SESSION_AMOUNT_KEY   = "pending_order_amount";
const SESSION_METHOD_KEY   = "pending_order_method";

// ── Helpers ─────────────────────────────────────────────────
function formatPhoneInput(value) {
  const digits = String(value).replace(/[^0-9]/g, "").slice(0, 10);
  if (!digits) return "";
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

function failureMessage(status, lang) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  switch (String(status || "").toUpperCase()) {
    case "USERCANCELLED":
      return t(
        "Ulikataa ombi kwenye simu yako. Jaribu tena.",
        "You declined the prompt on your phone. Try again."
      );
    case "CANCELLED":
      return t("Malipo yameghairiwa. Jaribu tena.", "Payment was cancelled. Try again.");
    case "REJECTED":
      return t(
        "Malipo yamekataliwa. Angalia salio lako kisha ujaribu tena.",
        "Payment rejected. Check your balance and try again."
      );
    case "FAILED":
    default:
      return t("Malipo hayakufanikishwa. Jaribu tena.", "Payment failed. Try again.");
  }
}

// ── Session persistence ─────────────────────────────────────
const session = {
  save(orderId, amount, methodKey) {
    try {
      sessionStorage.setItem(SESSION_ORDER_KEY, orderId);
      sessionStorage.setItem(SESSION_AMOUNT_KEY, String(amount));
      sessionStorage.setItem(SESSION_METHOD_KEY, methodKey);
    } catch { /* noop */ }
  },
  read() {
    try {
      return {
        orderId: sessionStorage.getItem(SESSION_ORDER_KEY),
        amount: sessionStorage.getItem(SESSION_AMOUNT_KEY),
        method: sessionStorage.getItem(SESSION_METHOD_KEY),
      };
    } catch { return { orderId: null, amount: null, method: null }; }
  },
  clear() {
    try {
      sessionStorage.removeItem(SESSION_ORDER_KEY);
      sessionStorage.removeItem(SESSION_AMOUNT_KEY);
      sessionStorage.removeItem(SESSION_METHOD_KEY);
    } catch { /* noop */ }
  },
};

// ── Method option row ───────────────────────────────────────
function MethodOption({ method, selected, onSelect, disabled }) {
  const Icon =
    method.icon === "card" ? CreditCard :
    method.icon === "bank" ? Building2 :
    Smartphone;
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

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PaymentGateway({
  amount,
  title,
  description,
  onInitiate,     // async ({ methodKey, methodLabel, phone }) => { ok, orderId, gatewayUrl, ... }
  onSuccess,      // (data) => void
  onCancel,       // () => void
}) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  // stage: select | initiating | polling | redirecting | done | error
  const [stage, setStage] = useState("select");
  const [error, setError] = useState("");
  const [methodKey, setMethodKey] = useState(null);
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [simulated, setSimulated] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [finalRef, setFinalRef] = useState("");
  const [channel, setChannel] = useState("");

  const cancelledRef = useRef(false);
  const pollTimerRef = useRef(null);

  const method = methodKey ? [...MOBILE_METHODS, ...CARD_METHODS].find((m) => m.key === methodKey) : null;
  const isMobile = methodKey ? isMobileMethod(methodKey) : false;
  const isCard = methodKey ? isCardMethod(methodKey) : false;
  const phoneOk = isValidTzPhone(phone);

  const canPay = Boolean(method) && (isCard || (isMobile && phoneOk)) && stage === "select";

  // ── Cleanup ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // ── Resume a pending order after refresh / return from redirect
  useEffect(() => {
    const saved = session.read();
    if (!saved.orderId) return;
    if (saved.amount && Number(saved.amount) !== Number(amount)) return;
    setOrderId(saved.orderId);
    if (saved.method) setMethodKey(saved.method);
    setStage("polling");
    runPolling(saved.orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Polling ─────────────────────────────────────────────
  const runPolling = async (oid) => {
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      if (cancelledRef.current) return;
      await new Promise((resolve) => {
        pollTimerRef.current = setTimeout(resolve, POLL_INTERVAL_MS);
      });
      if (cancelledRef.current) return;
      setAttempt(i + 1);

      let data;
      try { data = await paymentsApi.orderStatus(oid); } catch { continue; }

      const status = String(data?.payment_status || "").toUpperCase();
      if (data?.channel) setChannel(data.channel);
      if (data?.simulated != null) setSimulated(Boolean(data.simulated));

      if (status === "SUCCESS") {
        setFinalRef(data?.transid || data?.order_id || "");
        setStage("done");
        session.clear();
        onSuccess?.(data);
        return;
      }

      if (TERMINAL_FAILURE.has(status)) {
        setError(failureMessage(status, lang));
        setStage("error");
        return;
      }
      // PENDING / INPROGRESS → keep polling
    }

    setError(
      t(
        "Muda wa malipo umepita. Angalia historia ya miamala yako.",
        "Payment timed out. Check your transaction history."
      )
    );
    setStage("error");
  };

  // ── Initiate + route ────────────────────────────────────
  const handlePay = async () => {
    if (!canPay || !onInitiate) return;
    setStage("initiating");
    setError("");

    const cleanPhone = isMobile ? normalizeTzPhone(phone) : null;

    let res;
    try {
      res = await onInitiate({
        methodKey: method.key,
        methodLabel: method.label,
        phone: cleanPhone,
        isCard,
        isMobile,
      });
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Hitilafu ya mtandao.", "Network error.")
      );
      setStage("error");
      return;
    }

    if (!res || res.ok === false) {
      const detail =
        res?.error?.data?.detail ||
        res?.error?.data?.message ||
        res?.error?.message ||
        (typeof res?.error === "string" ? res.error : "");
      setError(detail || t("Hatua ya malipo imeshindikana.", "Payment step failed."));
      setStage("error");
      return;
    }

    const oid = res.orderId || "";
    const pstatus = String(res.paymentStatus || "").toUpperCase();
    setOrderId(oid);
    setSimulated(Boolean(res.simulated));
    if (res.channel) setChannel(res.channel);

    // ── Card / bank redirect ────────────────────────────
    if (res.gatewayUrl) {
      session.save(oid, amount, method.key);
      setStage("redirecting");
      setTimeout(() => { window.location.href = res.gatewayUrl; }, 600);
      return;
    }

    // ── Instant SUCCESS ─────────────────────────────────
    if (pstatus === "SUCCESS") {
      setFinalRef(res.transid || oid || "");
      setStage("done");
      session.clear();
      onSuccess?.(res);
      return;
    }

    // ── Terminal failure ────────────────────────────────
    if (TERMINAL_FAILURE.has(pstatus)) {
      setError(failureMessage(pstatus, lang));
      setStage("error");
      return;
    }

    if (!oid) {
      setError(
        t(
          "Backend haikurudisha order_id. Wasiliana na msaada.",
          "Backend did not return an order_id. Contact support."
        )
      );
      setStage("error");
      return;
    }

    // ── Mobile: poll ────────────────────────────────────
    session.save(oid, amount, method.key);
    setStage("polling");
    runPolling(oid);
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    session.clear();
    onCancel?.();
  };

  const handleRetry = () => {
    cancelledRef.current = false;
    setError("");
    setStage("select");
    setAttempt(0);
    setOrderId(null);
    setChannel("");
  };

  const TestModeBadge = () =>
    simulated ? (
      <span
        className="inline-block text-[10px] font-bold px-2 py-1 rounded-full"
        style={{ background: "rgba(232,163,61,0.15)", color: "#8A5A16" }}
      >
        TEST MODE
      </span>
    ) : null;

  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════

  // ── DONE ────────────────────────────────────────────────
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
          {formatTZS(amount)}
          {channel ? <> · {channel}</> : null}
        </p>
        {finalRef && (
          <p className="text-[11px] text-muted font-mono mb-3">
            {t("Kumbukumbu", "Reference")}: {finalRef}
          </p>
        )}
        <TestModeBadge />
      </div>
    );
  }

  // ── REDIRECTING (card/bank) ─────────────────────────────
  if (stage === "redirecting") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-8 text-center"
      >
        <ExternalLink size={28} className="mx-auto mb-3" color={COLORS.gold} />
        <p className="text-primary text-sm font-semibold mb-2">
          {t("Unahamishwa kwenye ukurasa wa malipo...", "Redirecting to payment page...")}
        </p>
        <p className="text-[11px] text-muted">
          {t("Usifunge ukurasa huu.", "Do not close this page.")}
        </p>
        <div className="mt-4">
          <Loader2 size={18} className="animate-spin mx-auto" color={COLORS.gold} />
        </div>
      </div>
    );
  }

  // ── INITIATING ──────────────────────────────────────────
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

  // ── POLLING (mobile) ────────────────────────────────────
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
            TEST MODE —{" "}
            {t("Hakuna pesa halisi inayotolewa", "No real money is charged")}
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
            "Tumetuma ombi la malipo kwenye simu yako. Idhinisha kwa kuingiza PIN yako.",
            "We sent a payment request to your phone. Approve it by entering your PIN."
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

  // ── ERROR ───────────────────────────────────────────────
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

  // ═════════════════════════════════════════════════════════
  // SELECT (default) — method + phone input
  // ═════════════════════════════════════════════════════════
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

      {/* Amount header */}
      <div className="flex flex-col items-center text-center gap-1 mb-4">
        <span className="text-primary text-sm font-semibold">{title}</span>
        <span style={{ color: COLORS.rust }} className="text-lg font-bold">
          {formatTZS(amount)}
        </span>
        <TestModeBadge />
      </div>

      {description && (
        <p className="text-secondary text-body-sm mb-4 text-center">{description}</p>
      )}

      {/* Method section */}
      <p className="text-primary text-body-sm font-semibold mb-2 text-center">
        {t("Chagua Njia ya Malipo", "Choose Payment Method")}
      </p>

      {/* Mobile money */}
      <p className="text-[11px] font-semibold text-secondary uppercase mb-1.5 tracking-wide">
        {t("Malipo ya Simu", "Mobile Money")}
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {MOBILE_METHODS.map((m) => (
          <MethodOption
            key={m.key}
            method={m}
            selected={m.key === methodKey}
            onSelect={setMethodKey}
            disabled={stage !== "select"}
          />
        ))}
      </div>

      {/* Card / bank */}
      <p className="text-[11px] font-semibold text-secondary uppercase mb-1.5 tracking-wide">
        {t("Kadi / Benki", "Card / Bank")}
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {CARD_METHODS.map((m) => (
          <MethodOption
            key={m.key}
            method={m}
            selected={m.key === methodKey}
            onSelect={setMethodKey}
            disabled={stage !== "select"}
          />
        ))}
      </div>

      {/* Phone input — only for mobile */}
      {isMobile && (
        <label className="flex flex-col gap-1.5 mb-4 text-center">
          <span className="text-primary text-body-sm font-medium">
            {t("Namba ya Simu", "Phone Number")} ({method?.label})
          </span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            style={{
              background: COLORS.sand,
              borderColor: COLORS.sandLine,
              color: COLORS.night,
            }}
            className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
            placeholder={t("mfano: 0712 345 678", "e.g. 0712 345 678")}
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            disabled={stage !== "select"}
          />
          {phone && !phoneOk && (
            <span className="text-[11px]" style={{ color: COLORS.rust }}>
              {t(
                "Weka namba sahihi ya Tanzania (mf. 0712345678).",
                "Enter a valid Tanzania number (e.g. 0712345678)."
              )}
            </span>
          )}
        </label>
      )}

      {/* Card hint */}
      {isCard && (
        <div
          className="rounded-lg px-3 py-2.5 mb-4 text-[11px] flex items-start gap-2"
          style={{ background: "rgba(47,109,79,0.08)", color: COLORS.green }}
        >
          <ExternalLink size={12} className="shrink-0 mt-0.5" />
          <span>
            {t(
              "Utapelekwa kwenye ukurasa salama wa FimiPay kukamilisha malipo kwa kadi yako.",
              "You'll be taken to FimiPay's secure page to complete payment by card."
            )}
          </span>
        </div>
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
        {isCard
          ? t(
              `Endelea — Lipa ${formatTZS(amount)}`,
              `Continue — Pay ${formatTZS(amount)}`
            )
          : t(
              `Lipa ${formatTZS(amount)}`,
              `Pay ${formatTZS(amount)}`
            )}
      </button>

      <p className="text-muted flex items-start justify-center gap-1.5 text-body-sm leading-snug text-center">
        <ShieldCheck size={13} className="shrink-0 mt-0.5" />
        <span>
          {lang === "sw"
            ? "Malipo yako yanalindwa. Hatuna uwezo wa kuona PIN au taarifa za kadi yako."
            : "Your payment is secure. We never see your PIN or card details."}
        </span>
      </p>
    </div>
  );
}
