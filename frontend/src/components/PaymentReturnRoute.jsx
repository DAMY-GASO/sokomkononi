// ============================================================
// PaymentReturnRoute.jsx — /payments/return
//
// After FimiPay's hosted card checkout, the user lands here.
// Read sessionStorage.pending_order_id, resume polling until a
// terminal status, then show success/failure.
// ============================================================
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { COLORS } from "../pages/dashboard/components/shared";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  pollOrderStatus,
  TERMINAL_FAILURE,
} from "../api/payments.js";

const SS_ORDER_ID = "pending_order_id";
const SS_AMOUNT   = "pending_order_amount";

export default function PaymentReturnRoute() {
  const { lang } = useLanguage();
  const sw = lang === "sw";
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [stage, setStage] = useState("POLLING");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [channel, setChannel] = useState("");
  const [transid, setTransid] = useState("");

  useEffect(() => {
    let cancelled = false;

    const clearPending = () => {
      try {
        sessionStorage.removeItem(SS_ORDER_ID);
        sessionStorage.removeItem(SS_AMOUNT);
      } catch { /* noop */ }
    };

    let orderId = null;
    try { orderId = sessionStorage.getItem(SS_ORDER_ID); } catch { /* noop */ }
    if (!orderId) {
      orderId =
        params.get("order_id") ||
        params.get("orderId") ||
        params.get("reference") ||
        null;
    }

    if (!orderId) {
      setStage("FAILED");
      setError(
        sw
          ? "Hatukupata kumbukumbu ya malipo. Angalia Miamala Yangu."
          : "We couldn't find the payment reference. Check My Transactions."
      );
      return;
    }

    (async () => {
      const result = await pollOrderStatus(orderId, {
        onProgress: (n) => { if (!cancelled) setAttempt(n); },
      });
      if (cancelled) return;

      const status = String(result?.status || result?.data?.payment_status || "").toUpperCase();
      if (result.data?.channel) setChannel(result.data.channel);
      if (result.data?.transid) setTransid(result.data.transid);

      if (result.ok && status === "SUCCESS") {
        clearPending();
        setStage("SUCCESS");
        return;
      }

      clearPending();
      setStage("FAILED");
      if (status === "TIMEOUT") {
        setError(
          sw
            ? "Malipo hayajathibitishwa kwa muda uliopangwa. Angalia Miamala Yangu baadaye."
            : "Payment wasn't confirmed in time. Check My Transactions later."
        );
      } else if (TERMINAL_FAILURE.has(status)) {
        setError(
          sw
            ? "Malipo hayakufanikiwa. Tafadhali jaribu tena."
            : "Payment did not go through. Please try again."
        );
      } else {
        setError(
          result?.data?.detail && typeof result.data.detail === "string"
            ? result.data.detail
            : (sw
                ? "Malipo hayajakamilika. Jaribu tena."
                : "Payment was not completed. Try again.")
        );
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{ background: COLORS.sand, minHeight: "100vh" }}
      className="flex items-center justify-center p-4"
    >
      <div
        style={{ borderColor: COLORS.sandLine }}
        className="bg-white rounded-2xl border max-w-md w-full p-8 text-center"
        aria-live="polite"
      >
        {stage === "POLLING" && (
          <>
            <Loader2 size={32} className="animate-spin mx-auto mb-4" color={COLORS.gold} />
            <h1 className="text-lg font-bold text-primary mb-2">
              {sw
                ? "Tunathibitisha malipo..."
                : "Confirming your payment..."}
            </h1>
            <p className="text-sm text-secondary mb-3">
              {sw
                ? "Tafadhali usifunge ukurasa huu."
                : "Please don't close this page."}
            </p>
            <p className="text-[11px] text-muted">
              {attempt}/30
            </p>
          </>
        )}

        {stage === "SUCCESS" && (
          <>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(47,109,79,0.12)" }}
            >
              <CheckCircle size={28} color={COLORS.green} />
            </div>
            <h1 className="text-lg font-bold text-primary mb-2">
              {sw ? "Malipo Yamefanikiwa!" : "Payment Successful!"}
            </h1>
            <p className="text-sm text-secondary mb-3">
              {sw
                ? "Asante. Unaweza kuendelea kutumia SokoMkononi."
                : "Thank you. You can keep using SokoMkononi."}
            </p>
            {channel && (
              <p className="text-xs text-secondary mb-2">
                {sw ? "Njia" : "Channel"}: <strong>{channel}</strong>
              </p>
            )}
            {transid && (
              <p className="text-[11px] text-muted font-mono mb-5">
                {sw ? "Kumbukumbu" : "Reference"}: {transid}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => navigate("/dashboard/transactions")}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: COLORS.gold, color: COLORS.night }}
              >
                {sw ? "Miamala Yangu" : "My Transactions"}
              </button>
              <Link
                to="/"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-primary text-center"
              >
                {sw ? "Nyumbani" : "Home"}
              </Link>
            </div>
          </>
        )}

        {stage === "FAILED" && (
          <>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(193,80,46,0.12)" }}
            >
              <AlertTriangle size={28} color={COLORS.rust} />
            </div>
            <h1 className="text-lg font-bold text-primary mb-2">
              {sw ? "Malipo Hayajakamilika" : "Payment Incomplete"}
            </h1>
            <p className="text-sm text-secondary mb-5">
              {typeof error === "string" ? error : (sw ? "Hitilafu imetokea." : "Something went wrong.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => navigate("/dashboard/transactions")}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-primary"
              >
                {sw ? "Miamala Yangu" : "My Transactions"}
              </button>
              <Link
                to="/"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center"
                style={{ background: COLORS.gold, color: COLORS.night }}
              >
                {sw ? "Nyumbani" : "Home"}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
