// ============================================================
// PaymentGateway.jsx — FimiPay modal
//
// Implements the state machine from the FimiPay frontend spec:
//   SELECT | INITIATING | POLLING | REDIRECTING | SUCCESS | FAILED
//
// The component never talks to FimiPay directly. The parent page
// receives `onInitiate({ methodKey, phone })` and returns:
//   { ok, orderId, gatewayUrl, paymentStatus, simulated, channel, transid }
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone, CreditCard, Building2, Check, ChevronLeft,
  ShieldCheck, Loader2, AlertTriangle, ExternalLink,
} from "lucide-react";
import { COLORS, formatTZS } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { api } from "../../../api/client.js";
import {
  MOBILE_METHODS,
  CARD_METHODS,
  isMobileMethod,
  isCardMethod,
  normalizeTzPhone,
  isValidTzPhone,
  formatTzPhoneDisplay,
  POLL_INTERVAL_MS,
  MAX_POLL_ATTEMPTS,
  TERMINAL_FAILURE,
} from "../../../api/payments.js";

// ── Session keys (spec Section 8) ──────────────────────────
const SS_ORDER_ID  = "pending_order_id";
const SS_AMOUNT    = "pending_order_amount";
const SS_METHOD    = "pending_order_method";
const SS_CONTEXT   = "pending_order_context";

function contextKey(title, amount) {
  return `${title || ""}::${amount ?? ""}`;
}

const session = {
  save(orderId, amount, methodKey, ctxKey) {
    try {
      sessionStorage.setItem(SS_ORDER_ID, String(orderId || ""));
      sessionStorage.setItem(SS_AMOUNT, String(amount ?? ""));
      sessionStorage.setItem(SS_METHOD, String(methodKey || ""));
      sessionStorage.setItem(SS_CONTEXT, String(ctxKey || ""));
    } catch { /* noop */ }
  },
  read() {
    try {
      return {
        orderId: sessionStorage.getItem(SS_ORDER_ID),
        amount: sessionStorage.getItem(SS_AMOUNT),
        method: sessionStorage.getItem(SS_METHOD),
        context: sessionStorage.getItem(SS_CONTEXT),
      };
    } catch {
      return { orderId: null, amount: null, method: null, context: null };
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(SS_ORDER_ID);
      sessionStorage.removeItem(SS_AMOUNT);
      sessionStorage.removeItem(SS_METHOD);
      sessionStorage.removeItem(SS_CONTEXT);
    } catch { /* noop */ }
  },
};

// ── Status → message (spec Section 7) ──────────────────────
function failureMessage(status, lang) {
  const sw = lang === "sw";
  switch (String(status || "").toUpperCase()) {
    case "USERCANCELLED":
      return sw
        ? "Ulikataa ombi kwenye simu yako. Jaribu tena."
        : "You declined the prompt on your phone. Try again.";
    case "CANCELLED":
      return sw
        ? "Malipo yameghairiwa. Jaribu tena."
        : "Payment was cancelled. Try again.";
    case "REJECTED":
      return sw
        ? "Malipo yamekataliwa. Angalia salio lako kisha ujaribu tena."
        : "Payment rejected. Check your balance and try again.";
    case "FAILED":
      return sw
        ? "Malipo hayakufanikishwa. Jaribu tena."
        : "Payment failed. Try again.";
    case "TIMEOUT":
      return sw
        ? "Muda wa malipo umepita. Angalia historia ya miamala yako."
        : "Payment timed out. Check your transaction history.";
    default:
      return sw
        ? "Malipo hayakufanikishwa. Jaribu tena."
        : "Payment failed. Try again.";
  }
}

// ── Method row ─────────────────────────────────────────────
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
// MAIN
// ============================================================
export default function PaymentGateway({
  amount,
  title,
  description,
  onInitiate,
  onSuccess,
  onCancel,
}) {
  const { lang } = useLanguage();
  const sw = lang === "sw";

  // State machine
  const [stage, setStage] = useState("SELECT");
  const [error, setError] = useState("");

  // Form
  const [methodKey, setMethodKey] = useState(null);
  const [phone, setPhone] = useState("");

  // Order
  const [orderId, setOrderId] = useState(null);
  const [pollStatus, setPollStatus] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [simulated, setSimulated] = useState(false);
  const [channel, setChannel] = useState("");
  const [transid, setTransid] = useState("");

  const cancelledRef = useRef(false);
  const pollTimerRef = useRef(null);

  const isMobile = isMobileMethod(methodKey);
  const isCard = isCardMethod(methodKey);
  const method = [...MOBILE_METHODS, ...CARD_METHODS].find((m) => m.key === methodKey);

  const phoneValid = isValidTzPhone(phone);
  const canPay =
    Boolean(method) &&
    stage === "SELECT" &&
    (isCard || (isMobile && phoneValid));

  // ── Cleanup ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // ── Resume polling after refresh (spec Section 11.9) ────
  // Resume-poll ONLY if the stored context matches this mount's context.
  // Prevents "payment successful" from showing for the wrong flow when
  // two different features happen to share the same amount.
  useEffect(() => {
    const saved = session.read();
    if (!saved.orderId) return;

    const myKey = contextKey(title, amount);
    if (saved.context && saved.context !== myKey) {
      session.clear();
      return;
    }
    if (saved.amount && Number(saved.amount) !== Number(amount)) return;

    if (saved.method) setMethodKey(saved.method);
    setOrderId(saved.orderId);
    setStage("POLLING");
    runPoll(saved.orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Polling ─────────────────────────────────────────────
  const runPoll = async (oid) => {
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      if (cancelledRef.current) return;
      await new Promise((resolve) => {
        pollTimerRef.current = setTimeout(resolve, POLL_INTERVAL_MS);
      });
      if (cancelledRef.current) return;

      setAttempt(i + 1);

      let data;
      try {
        data = await api.post(
          "/payments/order-status/",
          { order_id: oid }
        );
      } catch {
        continue; // network blip
      }

      const status = String(data?.payment_status || "").toUpperCase();
      setPollStatus(status);
      if (data?.channel) setChannel(data.channel);
      if (data?.simulated != null) setSimulated(Boolean(data.simulated));
      if (data?.transid) setTransid(data.transid);

      if (status === "SUCCESS") {
        setTransid(data?.transid || data?.order_id || "");
        session.clear();
        setStage("SUCCESS");
        onSuccess?.(data);
        return;
      }

      if (TERMINAL_FAILURE.has(status)) {
        setError(failureMessage(status, lang));
        setStage("FAILED");
        return;
      }
    }

    // Timeout after 30 attempts
    setError(failureMessage("TIMEOUT", lang));
    setStage("FAILED");
  };

  // ── Initiate ────────────────────────────────────────────
  const handlePay = async () => {
    if (!canPay || !onInitiate) return;
    setStage("INITIATING");
    setError("");

    const cleanPhone = isMobile ? normalizeTzPhone(phone) : "";

    let res;
    try {
      res = await onInitiate({ methodKey: method.key, phone: cleanPhone });
    } catch (err) {
      setError(
        err?.data?.detail && typeof err.data.detail === "string"
          ? err.data.detail
          : err?.message ||
            (sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Try again.")
      );
      setStage("FAILED");
      return;
    }

    if (!res || res.ok === false) {
      const detail =
        (typeof res?.error?.data?.detail === "string" && res.error.data.detail) ||
        (typeof res?.error?.data?.message === "string" && res.error.data.message) ||
        (typeof res?.error?.message === "string" && res.error.message) ||
        (typeof res?.error === "string" && res.error) ||
        "";
      setError(detail || (sw ? "Malipo hayakuanza. Jaribu tena." : "Payment could not be started. Try again."));
      setStage("FAILED");
      return;
    }

    const oid = res.orderId || "";
    const pstatus = String(res.paymentStatus || "").toUpperCase();
    setOrderId(oid);
    setSimulated(Boolean(res.simulated));
    if (res.channel) setChannel(res.channel);
    if (res.transid) setTransid(res.transid);

    // ── Card / Bank → redirect ─────────────────────────
    if (res.gatewayUrl) {
      session.save(oid, amount, method.key, contextKey(title, amount));
      setStage("REDIRECTING");
      setTimeout(() => {
        window.location.href = res.gatewayUrl;
      }, 600);
      return;
    }

    // ── Instant SUCCESS (test mode with override) ──────
    if (pstatus === "SUCCESS") {
      setTransid(res.transid || oid || "");
      session.clear();
      setStage("SUCCESS");
      onSuccess?.(res);
      return;
    }

    // ── Terminal failure on initiate ───────────────────
    if (TERMINAL_FAILURE.has(pstatus)) {
      setError(failureMessage(pstatus, lang));
      setStage("FAILED");
      return;
    }

    if (!oid) {
      setError(
        sw
          ? "Backend haikurudisha order_id. Wasiliana na msaada."
          : "Backend did not return an order_id. Contact support."
      );
      setStage("FAILED");
      return;
    }

    // ── Mobile → poll ──────────────────────────────────
    session.save(oid, amount, method.key, contextKey(title, amount));
    setStage("POLLING");
    runPoll(oid);
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
    setStage("SELECT");
    setAttempt(0);
    setOrderId(null);
    setPollStatus("");
    setChannel("");
    setTransid("");
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
  // RENDER — one state at a time
  // ═════════════════════════════════════════════════════════

  // ── SUCCESS ─────────────────────────────────────────────
  if (stage === "SUCCESS") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-8 text-center"
        aria-live="polite"
      >
        <div
          style={{ background: COLORS.green }}
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
        >
          <Check color="white" size={26} />
        </div>
        <p className="text-primary text-base font-semibold mb-1">
          {sw ? "Malipo Yamefanikiwa!" : "Payment Successful!"}
        </p>
        <p className="text-secondary text-body-sm mb-2 font-semibold">
          {formatTZS(amount)}
        </p>
        {channel && (
          <p className="text-xs text-secondary mb-2">
            {sw ? "Njia" : "Channel"}: <strong>{channel}</strong>
          </p>
        )}
        {transid && (
          <p className="text-[11px] text-muted font-mono mb-3">
            {sw ? "Kumbukumbu" : "Reference"}: {transid}
          </p>
        )}
        <TestModeBadge />
      </div>
    );
  }

  // ── REDIRECTING ─────────────────────────────────────────
  if (stage === "REDIRECTING") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-8 text-center"
      >
        <ExternalLink size={28} className="mx-auto mb-3" color={COLORS.gold} />
        <p className="text-primary text-sm font-semibold mb-2">
          {sw
            ? "Unahamishwa kwenye ukurasa wa malipo..."
            : "Redirecting to payment page..."}
        </p>
        <p className="text-[11px] text-muted mb-4">
          {sw
            ? "Usifunge ukurasa huu."
            : "Do not close this page."}
        </p>
        <Loader2 size={18} className="animate-spin mx-auto" color={COLORS.gold} />
      </div>
    );
  }

  // ── INITIATING ──────────────────────────────────────────
  if (stage === "INITIATING") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-8 text-center"
      >
        <Loader2 size={28} className="animate-spin mx-auto mb-3" color={COLORS.gold} />
        <p className="text-primary text-sm font-semibold">
          {sw ? "Inaanzisha malipo..." : "Starting payment..."}
        </p>
      </div>
    );
  }

  // ── POLLING ─────────────────────────────────────────────
  if (stage === "POLLING") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-6 text-center"
        aria-live="polite"
      >
        {simulated && (
          <div
            className="rounded-lg px-3 py-2 mb-3 text-[11px] font-semibold"
            style={{ background: "rgba(232,163,61,0.12)", color: "#8A5A16" }}
          >
            TEST MODE —{" "}
            {sw
              ? "Hakuna pesa halisi inayotolewa"
              : "No real money is charged"}
          </div>
        )}
        <div
          style={{ background: `${COLORS.gold}20` }}
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Smartphone size={24} color={COLORS.gold} />
        </div>
        <p className="text-primary text-sm font-semibold mb-1">
          {sw ? "Angalia simu yako" : "Check your phone"}
        </p>
        <p className="text-secondary text-body-sm mb-4 max-w-md mx-auto">
          {sw
            ? "Tumetuma ombi la malipo kwenye simu yako. Idhinisha kwa kuingiza PIN yako."
            : "We sent a payment request to your phone. Approve it by entering your PIN."}
        </p>
        <div className="flex items-center justify-center gap-2 text-body-sm text-secondary mb-4">
          <Loader2 size={14} className="animate-spin" />
          {sw ? "Inasubiri uthibitisho..." : "Waiting for confirmation..."}
          <span className="text-muted">
            ({attempt}/{MAX_POLL_ATTEMPTS})
          </span>
        </div>
        {orderId && (
          <p className="text-[10px] text-muted font-mono mb-4">
            {sw ? "Order" : "Order"}: {orderId}
          </p>
        )}
        <button
          onClick={handleCancel}
          className="text-xs font-medium text-secondary hover:text-primary underline"
        >
          {sw ? "Ghairi" : "Cancel"}
        </button>
      </div>
    );
  }

  // ── FAILED ──────────────────────────────────────────────
  if (stage === "FAILED") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-6 text-center"
        aria-live="assertive"
      >
        <div
          style={{ background: "rgba(193,80,46,0.12)" }}
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
        >
          <AlertTriangle size={22} color={COLORS.rust} />
        </div>
        <p className="text-primary text-sm font-semibold mb-1">
          {sw ? "Malipo Hayakufanikiwa" : "Payment Failed"}
        </p>
        <p className="text-secondary text-body-sm mb-4">
          {typeof error === "string" ? error : (sw ? "Hitilafu imetokea." : "Something went wrong.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-secondary"
          >
            {sw ? "Ghairi" : "Cancel"}
          </button>
          <button
            onClick={handleRetry}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          >
            {sw ? "Jaribu Tena" : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // SELECT (default)
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
          <ChevronLeft size={14} /> {sw ? "Rudi Nyuma" : "Back"}
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
        {sw ? "Chagua Njia ya Malipo" : "Choose Payment Method"}
      </p>

      <p className="text-[11px] font-semibold text-secondary uppercase mb-1.5 tracking-wide">
        {sw ? "Malipo ya Simu" : "Mobile Money"}
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {MOBILE_METHODS.map((m) => (
          <MethodOption
            key={m.key}
            method={m}
            selected={m.key === methodKey}
            onSelect={setMethodKey}
            disabled={stage !== "SELECT"}
          />
        ))}
      </div>

      <p className="text-[11px] font-semibold text-secondary uppercase mb-1.5 tracking-wide">
        {sw ? "Kadi / Benki" : "Card / Bank"}
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {CARD_METHODS.map((m) => (
          <MethodOption
            key={m.key}
            method={m}
            selected={m.key === methodKey}
            onSelect={setMethodKey}
            disabled={stage !== "SELECT"}
          />
        ))}
      </div>

      {/* Phone input — mobile only */}
      {isMobile && (
        <label className="flex flex-col gap-1.5 mb-4 text-center">
          <span className="text-primary text-body-sm font-medium">
            {sw ? "Namba ya Simu" : "Phone Number"} ({method?.label})
          </span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            style={{
              background: COLORS.sand,
              borderColor: phone && !phoneValid ? COLORS.rust : COLORS.sandLine,
              color: COLORS.night,
            }}
            className="rounded-xl border px-3 py-2.5 text-sm outline-none text-center"
            placeholder={sw ? "0712 345 678" : "0712 345 678"}
            value={formatTzPhoneDisplay(phone)}
            onChange={(e) => setPhone(e.target.value)}
            disabled={stage !== "SELECT"}
          />
          {phone && !phoneValid && (
            <span className="text-[11px]" style={{ color: COLORS.rust }}>
              {sw
                ? "Weka namba sahihi ya Tanzania (mf. 0712345678)."
                : "Enter a valid Tanzania number (e.g. 0712345678)."}
            </span>
          )}
        </label>
      )}

      {isCard && (
        <div
          className="rounded-lg px-3 py-2.5 mb-4 text-[11px] flex items-start gap-2"
          style={{ background: "rgba(47,109,79,0.08)", color: COLORS.green }}
        >
          <ExternalLink size={12} className="shrink-0 mt-0.5" />
          <span>
            {sw
              ? "Utapelekwa kwenye ukurasa salama wa FimiPay kukamilisha malipo kwa kadi yako."
              : "You'll be taken to FimiPay's secure page to complete payment by card."}
          </span>
        </div>
      )}

      {error && (
        <div
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          className="rounded-lg px-3 py-2 mb-3 text-xs text-center flex items-center justify-center gap-1.5"
        >
          <AlertTriangle size={12} />
          {typeof error === "string" ? error : "Error"}
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
          ? sw
            ? `Endelea — Lipa ${formatTZS(amount)}`
            : `Continue — Pay ${formatTZS(amount)}`
          : sw
            ? `Lipa ${formatTZS(amount)}`
            : `Pay ${formatTZS(amount)}`}
      </button>

      <p className="text-muted flex items-start justify-center gap-1.5 text-body-sm leading-snug text-center">
        <ShieldCheck size={13} className="shrink-0 mt-0.5" />
        <span>
          {sw
            ? "Malipo yako yanalindwa. Hatuna uwezo wa kuona PIN au taarifa za kadi yako."
            : "Your payment is secure. We never see your PIN or card details."}
        </span>
      </p>
    </div>
  );
}
