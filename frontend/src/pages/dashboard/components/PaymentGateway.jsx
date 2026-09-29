// ============================================================
// PaymentGateway.jsx — FimiPay integration (spec-compliant)
//
// Contract (per FimiPay Frontend Integration Spec):
//   1. POST /pay/... with EMPTY body → returns { message, fimipay: {...} }
//   2. If fimipay.payment_gateway_url → redirect (card/bank)
//      Else → poll /payments/order-status/ every 4s
//   3. Stop on terminal status: SUCCESS | CANCELLED | USERCANCELLED |
//      REJECTED | FAILED. Keep polling on PENDING | INPROGRESS.
//   4. Max 30 attempts (~2 min) → timeout.
//   5. Show TEST MODE badge when fimipay.simulated === true.
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  Check,
  ShieldCheck,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { COLORS, formatTZS } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { paymentsApi } from "../../../api/payments.js";

// ── Spec constants ────────────────────────────────────────
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 30;                 // ~2 minutes per spec
const SESSION_ORDER_KEY = "pending_order_id";
const SESSION_AMOUNT_KEY = "pending_order_amount";

const TERMINAL_SUCCESS = new Set(["SUCCESS"]);
const TERMINAL_FAILURE = new Set([
  "CANCELLED",
  "USERCANCELLED",
  "REJECTED",
  "FAILED",
]);
const NON_TERMINAL = new Set(["PENDING", "INPROGRESS"]);

function isTerminal(status) {
  const s = String(status || "").toUpperCase();
  return TERMINAL_SUCCESS.has(s) || TERMINAL_FAILURE.has(s);
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
      return t(
        "Malipo yameghairiwa. Jaribu tena.",
        "Payment was cancelled. Try again."
      );
    case "REJECTED":
      return t(
        "Malipo yamekataliwa. Angalia salio lako kisha ujaribu tena.",
        "Payment rejected. Check your balance and try again."
      );
    case "FAILED":
      return t(
        "Malipo hayakufanikiwa. Jaribu tena.",
        "Payment failed. Try again."
      );
    default:
      return t(
        "Malipo hayakufanikiwa. Jaribu tena.",
        "Payment failed. Try again."
      );
  }
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

  // stage: select | initiating | polling | redirecting | done | error
  const [stage, setStage] = useState("select");
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [simulated, setSimulated] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [finalRef, setFinalRef] = useState("");
  const [channel, setChannel] = useState("");

  const cancelledRef = useRef(false);
  const pollTimerRef = useRef(null);

  // ── Cleanup on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // ── Resume pending order after refresh / return from redirect ─
  useEffect(() => {
    try {
      const storedOrder = sessionStorage.getItem(SESSION_ORDER_KEY);
      const storedAmount = sessionStorage.getItem(SESSION_AMOUNT_KEY);
      if (!storedOrder) return;
      if (storedAmount && Number(storedAmount) !== Number(amount)) return;
      setOrderId(storedOrder);
      setStage("polling");
      runPolling(storedOrder);
    } catch {
      /* sessionStorage unavailable */
    }
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
      try {
        data = await paymentsApi.orderStatus(oid);
      } catch {
        // Network blip — try again on next tick
        continue;
      }

      const status = String(data?.payment_status || "").toUpperCase();
      setChannel(data?.channel || "");
      if (data?.simulated != null) setSimulated(Boolean(data.simulated));

      if (status === "SUCCESS") {
        setFinalRef(data?.transid || data?.order_id || "");
        setStage("done");
        clearPendingOrder();
        onSuccess?.(data);
        return;
      }

      if (TERMINAL_FAILURE.has(status)) {
        setError(failureMessage(status, lang));
        setStage("error");
        return;
      }

      // PENDING / INPROGRESS → keep polling (fall through loop)
    }

    // Timed out
    setError(
      t(
        "Muda wa malipo umepita. Angalia historia ya miamala yako.",
        "Payment timed out. Check your transaction history."
      )
    );
    setStage("error");
  };

  // ── Session helpers ─────────────────────────────────────
  const savePendingOrder = (oid, amt) => {
    try {
      sessionStorage.setItem(SESSION_ORDER_KEY, oid);
      sessionStorage.setItem(SESSION_AMOUNT_KEY, String(amt));
    } catch {
      /* noop */
    }
  };
  const clearPendingOrder = () => {
    try {
      sessionStorage.removeItem(SESSION_ORDER_KEY);
      sessionStorage.removeItem(SESSION_AMOUNT_KEY);
    } catch {
      /* noop */
    }
  };

  // ── Initiate + route ────────────────────────────────────
  const handlePay = async () => {
    if (stage !== "select") return;
    if (!onInitiate) {
      setError("Payment handler missing.");
      return;
    }
    setStage("initiating");
    setError("");

    let res;
    try {
      // Spec: initiate with empty body {} — backend decides channel
      res = await onInitiate({});
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
      savePendingOrder(oid, amount);
      setStage("redirecting");
      // Give the UI one frame to render the "redirecting" state
      setTimeout(() => {
        window.location.href = res.gatewayUrl;
      }, 600);
      return;
    }

    // ── Instant SUCCESS on initiate ─────────────────────
    if (pstatus === "SUCCESS") {
      setFinalRef(res.transid || oid || "");
      setStage("done");
      clearPendingOrder();
      onSuccess?.(res);
      return;
    }

    // ── Terminal failure on initiate ────────────────────
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

    // ── Mobile money: start polling ─────────────────────
    savePendingOrder(oid, amount);
    setStage("polling");
    runPolling(oid);
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    clearPendingOrder();
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

  if (stage === "redirecting") {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-8 text-center"
      >
        <Loader2
          size={28}
          className="animate-spin mx-auto mb-3"
          color={COLORS.gold}
        />
        <p className="text-primary text-sm font-semibold">
          {t(
            "Unahamishwa kwenye ukurasa wa malipo...",
            "Redirecting to payment page..."
          )}
        </p>
        <p className="text-[11px] text-muted mt-2">
          {t(
            "Usifunge ukurasa huu.",
            "Do not close this page."
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
        <Loader2
          size={28}
          className="animate-spin mx-auto mb-3"
          color={COLORS.gold}
        />
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
            TEST MODE —{" "}
            {t(
              "Hakuna pesa halisi inayotolewa",
              "No real money is charged"
            )}
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
          {t("Rudi Nyuma", "Back")}
        </button>
      </div>

      <div className="flex flex-col items-center text-center gap-1 mb-4">
        <span className="text-primary text-sm font-semibold">{title}</span>
        <span style={{ color: COLORS.rust }} className="text-lg font-bold">
          {formatTZS(amount)}
        </span>
        <TestModeBadge />
      </div>

      {description && (
        <p className="text-secondary text-body-sm mb-4 text-center">
          {description}
        </p>
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
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm mb-3"
      >
        {lang === "sw"
          ? `Lipa ${formatTZS(amount)}`
          : `Pay ${formatTZS(amount)}`}
      </button>

      <p className="text-muted flex items-start justify-center gap-1.5 text-body-sm leading-snug text-center">
        <ShieldCheck size={13} className="shrink-0 mt-0.5" />
        <span>
          {lang === "sw"
            ? "Malipo yako yanalindwa. Ombi litatumwa kwenye simu yako uliyosajili."
            : "Your payment is secure. A request will be sent to your registered phone."}
        </span>
      </p>
    </div>
  );
}
