// ============================================================
// PaymentReturnRoute.jsx — return page after FimiPay hosted redirect
//
// Reads sessionStorage.pending_order_id, resumes polling, shows
// the outcome. Clears the pending order on terminal status.
// ============================================================
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { COLORS } from "../pages/dashboard/components/shared";
import { useLanguage } from "../context/LanguageContext.jsx";
import { paymentsApi, TERMINAL_FAILURE } from "../api/payments.js";

const POLL_INTERVAL_MS  = 4000;
const MAX_ATTEMPTS      = 30;
const SESSION_ORDER_KEY = "pending_order_id";
const SESSION_AMOUNT_KEY= "pending_order_amount";

export default function PaymentReturnRoute() {
  const { lang } = useLanguage();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [stage, setStage] = useState("polling");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [channel, setChannel] = useState("");
  const [finalRef, setFinalRef] = useState("");

  useEffect(() => {
    let cancelled = false;

    const clearPending = () => {
      try {
        sessionStorage.removeItem(SESSION_ORDER_KEY);
        sessionStorage.removeItem(SESSION_AMOUNT_KEY);
      } catch { /* noop */ }
    };

    let orderId = null;
    try { orderId = sessionStorage.getItem(SESSION_ORDER_KEY); } catch { /* noop */ }

    if (!orderId) {
      orderId =
        params.get("order_id") ||
        params.get("orderId") ||
        params.get("reference") ||
        null;
    }

    if (!orderId) {
      setStage("failed");
      setError(
        t(
          "Hatukupata kumbukumbu ya malipo. Angalia Miamala Yangu.",
          "We couldn't find the payment reference. Check My Transactions."
        )
      );
      return;
    }

    (async () => {
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (cancelled) return;
        setAttempt(i + 1);

        let data;
        try { data = await paymentsApi.orderStatus(orderId); } catch { /* retry */ }

        const status = String(data?.payment_status || "").toUpperCase();
        if (data?.channel) setChannel(data.channel);

        if (status === "SUCCESS") {
          clearPending();
          if (!cancelled) {
            setFinalRef(data?.transid || data?.order_id || "");
            setStage("success");
          }
          return;
        }

        if (TERMINAL_FAILURE.has(status)) {
          clearPending();
          if (!cancelled) {
            setStage("failed");
            setError(
              t(
                "Malipo hayakufanikiwa. Tafadhali jaribu tena.",
                "Payment did not go through. Please try again."
              )
            );
          }
          return;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }

      if (!cancelled) {
        setStage("failed");
        setError(
          t(
            "Malipo hayajathibitishwa kwa muda uliopangwa. Angalia Miamala Yangu baadaye.",
            "Payment wasn't confirmed in time. Check My Transactions later."
          )
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
      >
        {stage === "polling" && (
          <>
            <Loader2 size={32} className="animate-spin mx-auto mb-4" color={COLORS.gold} />
            <h1 className="text-lg font-bold text-primary mb-2">
              {t("Tunathibitisha malipo...", "Confirming your payment...")}
            </h1>
            <p className="text-sm text-secondary mb-3">
              {t(
                "Tafadhali usifunge ukurasa huu.",
                "Please don't close this page."
              )}
            </p>
            <p className="text-[11px] text-muted">
              {attempt}/{MAX_ATTEMPTS}
            </p>
          </>
        )}

        {stage === "success" && (
          <>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(47,109,79,0.12)" }}
            >
              <CheckCircle size={28} color={COLORS.green} />
            </div>
            <h1 className="text-lg font-bold text-primary mb-2">
              {t("Malipo Yamefanikiwa!", "Payment Successful!")}
            </h1>
            <p className="text-sm text-secondary mb-3">
              {t(
                "Asante. Unaweza kuendelea kutumia SokoMkononi.",
                "Thank you. You can keep using SokoMkononi."
              )}
            </p>
            {channel && (
              <p className="text-xs text-secondary mb-2">
                {t("Njia", "Channel")}: <strong>{channel}</strong>
              </p>
            )}
            {finalRef && (
              <p className="text-[11px] text-muted font-mono mb-5">
                {t("Kumbukumbu", "Reference")}: {finalRef}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => navigate("/dashboard/transactions")}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: COLORS.gold, color: COLORS.night }}
              >
                {t("Miamala Yangu", "My Transactions")}
              </button>
              <Link
                to="/"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-primary text-center"
              >
                {t("Nyumbani", "Home")}
              </Link>
            </div>
          </>
        )}

        {stage === "failed" && (
          <>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(193,80,46,0.12)" }}
            >
              <AlertTriangle size={28} color={COLORS.rust} />
            </div>
            <h1 className="text-lg font-bold text-primary mb-2">
              {t("Malipo Hayajakamilika", "Payment Incomplete")}
            </h1>
            <p className="text-sm text-secondary mb-5">{error}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => navigate("/dashboard/transactions")}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-primary"
              >
                {t("Miamala Yangu", "My Transactions")}
              </button>
              <Link
                to="/"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center"
                style={{ background: COLORS.gold, color: COLORS.night }}
              >
                {t("Nyumbani", "Home")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
